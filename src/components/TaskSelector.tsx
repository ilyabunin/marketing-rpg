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
    <div className="space-y-1">
      <div className="font-pixel text-[10px] text-rpg-gold mb-2">
        SELECT QUEST:
      </div>
      {tasks.map((t) => {
        const isSelected = t.id === selectedTaskId;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`w-full text-left px-2 py-1 font-body text-base transition-colors ${
              isSelected
                ? "text-rpg-gold bg-rpg-gold/10"
                : "text-rpg-text hover:text-rpg-gold hover:bg-rpg-gold/5"
            }`}
            style={{ borderRadius: 0 }}
          >
            <span className="inline-block w-5">
              {isSelected ? "▶" : " "}
            </span>
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
