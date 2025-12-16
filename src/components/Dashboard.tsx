"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    Calendar,
    MoreVertical,
    Loader2,
    Users,
    GripVertical
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Member, AppData } from "@/types";
import { cn } from "@/lib/utils";
import TaskModal from "./TaskModal";

export default function Dashboard() {
    const [data, setData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Sensors for DndKit
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchData = async () => {
        try {
            const res = await fetch("/api/data");
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchData();
    }, []);

    const saveData = async (newMembers: Member[]) => {
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members: newMembers })
            });
            // Update local state immediately for better UX
            if (data) {
                setData({ ...data, members: newMembers });
            }
        } catch (error) {
            console.error("Failed to save data", error);
            alert("Failed to save changes");
        }
    };

    const handleUpdate = (updatedMember: Member) => {
        if (!data) return;
        const updatedMembers = data.members.map((m) =>
            m.id === updatedMember.id ? updatedMember : m
        );
        saveData(updatedMembers);
    };





    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            if (!data) return;

            const oldIndex = data.members.findIndex((m) => m.id === active.id);
            const newIndex = data.members.findIndex((m) => m.id === over.id);

            const newMembers = arrayMove(data.members, oldIndex, newIndex);
            saveData(newMembers);
        }
    };

    // Fix for hydration mismatch / SSR issues with dnd-kit
    if (!isMounted) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-primary">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8 text-foreground">
            <header className="mb-10 flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white glow-text">
                        UAV 社員任務表
                    </h1>
                    <p className="text-muted-foreground">
                        社員任務更新頻率 : 2周整體大會時更改
                    </p>
                </div>
                {/* Add Member moved to Member Info Table */}
            </header>

            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg overflow-hidden shadow-2xl">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 bg-white/5 p-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-1">Sort</div>
                    <div className="col-span-2">Member</div>
                    <div className="col-span-3">進行中任務</div>
                    <div className="col-span-2">Deadline</div>
                    <div className="col-span-2">Progress</div>
                    <div className="col-span-1 text-center">Stats</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-white/5">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={data?.members.map(m => m.id) || []}
                            strategy={verticalListSortingStrategy}
                        >
                            {data?.members.map((member, index) => (
                                <SortableMemberRow
                                    key={member.id}
                                    member={member}
                                    index={index}
                                    onEdit={(m) => setSelectedMember(m)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            <AnimatePresence>
                {selectedMember && (
                    <TaskModal
                        key={selectedMember.id} // IMPORTANT: Key ensures AnimatePresence tracks this specific instance
                        member={selectedMember}
                        onClose={() => setSelectedMember(null)}
                        onUpdate={handleUpdate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function SortableMemberRow({ member, index, onEdit }: { member: Member; index: number; onEdit: (member: Member) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: member.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const isOverdue = new Date(member.currentTask.deadline) < new Date() && member.currentTask.progress < 100;

    // Group colors
    const getGroupColor = (group: string) => {
        switch (group) {
            case '電裝控制': return "bg-cyan-500/20 text-cyan-400 border-cyan-500/20";
            case '結構設計': return "bg-orange-500/20 text-orange-400 border-orange-500/20";
            case '公關相關': return "bg-pink-500/20 text-pink-400 border-pink-500/20";
            case '教學相關': return "bg-green-500/20 text-green-400 border-green-500/20";
            default: return "bg-white/10 text-white border-white/10";
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 hover:bg-white/5 transition-colors",
                isDragging && "bg-white/10 ring-1 ring-blue-500/50"
            )}
        >
            {/* Drag Handle */}
            <div className="col-span-1 flex items-center justify-center md:justify-start">
                <button
                    className="p-2 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition-colors touch-none"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-5 w-5" />
                </button>
            </div>

            {/* Member Name */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                    {member.name[0]}
                </div>
                <span className="font-semibold text-lg text-white/90">{member.name}</span>
            </div>

            {/* Task Content */}
            <div className="col-span-1 md:col-span-3">
                <div className="font-medium text-blue-100 text-lg">{member.currentTask.title}</div>
                <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold border",
                        getGroupColor(member.currentTask.group)
                    )}>
                        {member.currentTask.group}
                    </span>
                </div>
            </div>

            {/* Deadline */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className={isOverdue ? "text-red-400 font-bold" : "text-white/80"}>
                    {member.currentTask.deadline}
                </span>
            </div>

            {/* Progress */}
            <div className="col-span-1 md:col-span-2">
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                    <span>{member.currentTask.progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        className={cn(
                            "h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]",
                            member.currentTask.progress === 100 ? "bg-gradient-to-r from-green-400 to-emerald-500" :
                                isOverdue ? "bg-gradient-to-r from-red-500 to-orange-500" :
                                    "bg-gradient-to-r from-blue-400 to-cyan-400"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${member.currentTask.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="col-span-1 flex flex-row md:flex-col items-center justify-start md:justify-center gap-3 md:gap-1">
                <div className="flex items-center gap-1 text-green-400 text-xs font-bold" title="Success">
                    <CheckCircle2 className="h-3 w-3" /> {member.stats.success}
                </div>
                <div className="flex items-center gap-1 text-red-400 text-xs font-bold" title="Failed">
                    <XCircle className="h-3 w-3" /> {member.stats.failed}
                </div>
            </div>

            {/* Actions */}
            <div className="col-span-1 text-right hidden md:flex items-center justify-end gap-2">
                <button
                    onClick={() => onEdit(member)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                    title="Edit Task"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>
            </div>
            {/* Mobile Action */}
            <div className="col-span-1 md:hidden mt-2 flex gap-2">
                <button
                    onClick={() => onEdit(member)}
                    className="flex-1 py-2 bg-white/5 rounded text-sm text-center text-white/70 hover:bg-white/10 transition-colors"
                >
                    Manage
                </button>
            </div>
        </div>
    );
}
