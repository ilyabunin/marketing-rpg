"use client";

interface TaskOption {
  id: string;
  name: string;
  description: string;
}

interface TaskSelectorProps {
  tasks: TaskOption[];
  selectedTaskId: string | null;
  onSelect: (taskId: string) => void;
}

export default function TaskSelector({
  tasks,
  selectedTaskId,
  onSelect,
}: TaskSelectorProps) {
  return (
    <select
      value={selectedTaskId || ""}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full p-2 bg-[#1a1025] border border-[#4a3f5d] rounded text-white text-sm outline-none focus:border-amber-400"
    >
      <option value="" disabled>
        Select a task...
      </option>
      {tasks.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
