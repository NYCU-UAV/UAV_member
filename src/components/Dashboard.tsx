"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    Calendar,
    MoreVertical,
    Loader2,
    GripVertical,
    ArrowLeft,
    Settings2,
    Filter,
    X as XIcon
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

import { Member, AppData, Group } from "@/types";
import { cn } from "@/lib/utils";
import TaskModal from "./TaskModal";
import GroupManageModal, { getGroupStyle } from "./GroupManageModal";

const DEFAULT_GROUPS: Group[] = [
    { id: "g1", name: "電裝控制", color: "cyan" },
    { id: "g2", name: "結構設計", color: "orange" },
    { id: "g3", name: "公關相關", color: "pink" },
    { id: "g4", name: "教學相關", color: "green" },
];

export default function Dashboard() {
    const [data, setData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [filterGroups, setFilterGroups] = useState<Set<string>>(new Set()); // empty = show all
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

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

    const saveData = async (newData: AppData) => {
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });
            setData(newData);
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
        saveData({ ...data, members: updatedMembers });
    };

    const handleGroupsSave = async (newGroups: Group[]) => {
        if (!data) return;
        await saveData({ ...data, groups: newGroups });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            if (!data) return;
            const oldIndex = data.members.findIndex((m) => m.id === active.id);
            const newIndex = data.members.findIndex((m) => m.id === over.id);
            const newMembers = arrayMove(data.members, oldIndex, newIndex);
            saveData({ ...data, members: newMembers });
        }
    };

    // Get effective groups (stored or defaults)
    const groups: Group[] = (data?.groups && data.groups.length > 0) ? data.groups : DEFAULT_GROUPS;

    // Toggle filter
    const toggleFilter = (groupName: string) => {
        setFilterGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) {
                next.delete(groupName);
            } else {
                next.add(groupName);
            }
            return next;
        });
    };

    const clearFilter = () => setFilterGroups(new Set());

    // Filtered members
    const displayedMembers = (data?.members || []).filter(m => {
        if (filterGroups.size === 0) return true;
        const taskGroups = m.currentTask.group ? m.currentTask.group.split(',').map(s => s.trim()) : [];
        return taskGroups.some(g => filterGroups.has(g));
    });

    if (!isMounted) return null;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-primary">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8 text-foreground">
            <header className="mb-10 flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <h1 className="text-3xl font-bold tracking-tight text-white glow-text">
                            UAV 社員任務表
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        社員任務更新頻率 : 2周整體大會時更改
                    </p>
                </div>

                {/* Right-side controls */}
                <div className="flex items-center gap-2 pt-1 flex-shrink-0">
                    {/* Filter button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(v => !v)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all",
                                filterGroups.size > 0
                                    ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                            )}
                        >
                            <Filter className="h-4 w-4" />
                            篩選 Group
                            {filterGroups.size > 0 && (
                                <span className="bg-indigo-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                    {filterGroups.size}
                                </span>
                            )}
                        </button>

                        {/* Dropdown */}
                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl z-40 p-3 space-y-1"
                                >
                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">顯示群組</span>
                                        {filterGroups.size > 0 && (
                                            <button
                                                onClick={clearFilter}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                            >
                                                <XIcon className="h-3 w-3" /> 清除篩選
                                            </button>
                                        )}
                                    </div>
                                    {groups.map(g => {
                                        const style = getGroupStyle(g.color);
                                        const active = filterGroups.has(g.name);
                                        return (
                                            <button
                                                key={g.id}
                                                onClick={() => toggleFilter(g.name)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
                                                    active ? `${style.bg} ${style.text}` : "text-slate-300 hover:bg-white/5"
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-2.5 h-2.5 rounded-full shrink-0",
                                                    active ? style.preview : "bg-white/20"
                                                )} />
                                                <span className="flex-1 text-left">{g.name}</span>
                                                {active && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Manage Groups button */}
                    <button
                        onClick={() => setIsGroupModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white font-medium text-sm transition-all"
                    >
                        <Settings2 className="h-4 w-4" />
                        管理 Group
                    </button>
                </div>
            </header>

            {/* Active filter chips */}
            {filterGroups.size > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs text-slate-400 mt-1">篩選中：</span>
                    {Array.from(filterGroups).map(name => {
                        const g = groups.find(gr => gr.name === name);
                        const style = g ? getGroupStyle(g.color) : getGroupStyle("cyan");
                        return (
                            <span key={name} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", style.bg, style.text, style.border)}>
                                {name}
                                <button onClick={() => toggleFilter(name)} className="hover:opacity-70">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

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
                            items={(data?.members || []).map(m => m.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {displayedMembers.map((member, index) => (
                                <SortableMemberRow
                                    key={member.id}
                                    member={member}
                                    index={index}
                                    groups={groups}
                                    onEdit={(m) => setSelectedMember(m)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {displayedMembers.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            {filterGroups.size > 0 ? "此篩選條件下沒有成員" : "沒有成員資料"}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedMember && (
                    <TaskModal
                        key={selectedMember.id}
                        member={selectedMember}
                        groups={groups}
                        onClose={() => setSelectedMember(null)}
                        onUpdate={handleUpdate}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGroupModalOpen && (
                    <GroupManageModal
                        isOpen={isGroupModalOpen}
                        onClose={() => setIsGroupModalOpen(false)}
                        groups={groups}
                        onSave={handleGroupsSave}
                    />
                )}
            </AnimatePresence>

            {/* Close filter dropdown when clicking outside */}
            {isFilterOpen && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFilterOpen(false)}
                />
            )}
        </div>
    );
}

function SortableMemberRow({ member, index, groups, onEdit }: { member: Member; index: number; groups: Group[]; onEdit: (member: Member) => void }) {
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

    // Dynamic group color from groups list
    const getGroupStyle2 = (groupName: string) => {
        const g = groups.find(gr => gr.name === groupName);
        if (!g) return { bg: "bg-white/10", text: "text-white", border: "border-white/10" };
        return getGroupStyle(g.color);
    };

    const taskGroups = member.currentTask.group ? member.currentTask.group.split(',').map(s => s.trim()).filter(Boolean) : [];

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
                <div className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                    {taskGroups.map(gName => {
                        const gs = getGroupStyle2(gName);
                        return (
                            <span key={gName} className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold border",
                                gs.bg, gs.text, gs.border
                            )}>
                                {gName}
                            </span>
                        );
                    })}
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
