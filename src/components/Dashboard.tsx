"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
    CheckCircle2,
    XCircle,
    Calendar,
    MoreVertical,
    Loader2,
    Users,
    GripVertical
} from "lucide-react";
import { Member, AppData } from "@/types";
import { cn } from "@/lib/utils";
import TaskModal from "./TaskModal";

export default function Dashboard() {
    const [data, setData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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
        fetchData();
    }, []);

    const saveData = async (newMembers: Member[]) => {
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members: newMembers })
            });
            setData({ ...data!, members: newMembers });
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
        setData({ ...data, members: updatedMembers });
    };

    const handleAddMember = () => {
        if (!data) return;
        const name = prompt("Enter new member name:");
        if (!name) return;

        const newMember: Member = {
            id: Date.now().toString(),
            name,
            currentTask: {
                title: "New Task",
                deadline: new Date().toISOString().split('T')[0],
                group: "電裝控制",
                progress: 0
            },
            stats: { success: 0, failed: 0 },
            history: []
        };

        saveData([...data.members, newMember]);
    };

    const handleDeleteMember = (id: string) => {
        if (!data) return;
        if (!confirm("Are you sure you want to delete this member? All data will be lost.")) return;
        const newMembers = data.members.filter(m => m.id !== id);
        saveData(newMembers);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && data) {
            const oldIndex = data.members.findIndex((m) => m.id === active.id);
            const newIndex = data.members.findIndex((m) => m.id === over?.id);

            const newMembers = arrayMove(data.members, oldIndex, newIndex);
            saveData(newMembers);
        }
    };

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
                        社員任務更新頻率 : 2周大會一次
                    </p>
                </div>
                <button
                    onClick={handleAddMember}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-blue-400/20 shadow-lg hover:shadow-blue-500/20"
                >
                    <Users className="h-4 w-4" /> Add Member
                </button>
            </header>

            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg overflow-hidden shadow-2xl">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 bg-white/5 p-4 text-sm font-medium text-muted-foreground uppercase tracking-wider pl-12">
                    <div className="col-span-2">Member</div>
                    <div className="col-span-4">Current Task</div>
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
                            <AnimatePresence>
                                {data?.members.map((member, index) => (
                                    <MemberRow
                                        key={member.id}
                                        member={member}
                                        index={index}
                                        onEdit={(m) => setSelectedMember(m)}
                                        onDelete={() => handleDeleteMember(member.id)}
                                    />
                                ))}
                            </AnimatePresence>
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

function MemberRow({ member, index, onEdit, onDelete }: { member: Member; index: number; onEdit: (member: Member) => void; onDelete: () => void }) {
    const isOverdue = new Date(member.currentTask.deadline) < new Date() && member.currentTask.progress < 100;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: member.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

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
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 pl-12 hover:bg-white/5 transition-colors bg-[#020617] md:bg-transparent"
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute left-4 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300 transition-colors p-1"
            >
                <GripVertical className="h-5 w-5" />
            </div>

            {/* Member Name */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                    {member.name[0]}
                </div>
                <span className="font-semibold text-lg text-white/90">{member.name}</span>
            </div>

            {/* Task Content */}
            <div className="col-span-1 md:col-span-4">
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
                <button
                    onClick={onDelete}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                    title="Delete Member"
                >
                    <XCircle className="h-5 w-5" />
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
                <button
                    onClick={onDelete}
                    className="py-2 px-4 bg-red-500/10 rounded text-sm text-center text-red-400 hover:bg-red-500/20 transition-colors"
                >
                    Del
                </button>
            </div>
        </motion.div>
    );
}
