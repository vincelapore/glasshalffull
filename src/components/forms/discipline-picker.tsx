"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { forwardRef, type CSSProperties, type Ref } from "react";

import { DisciplineIcon } from "@/components/discipline-tag";
import { ChoiceControl } from "@/components/ui/choice";
import { disciplineLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { disciplines } from "@/lib/validations";

type Discipline = (typeof disciplines)[number];

export function DisciplinePicker({
  value,
  onChange,
}: {
  value: readonly Discipline[];
  onChange: (next: Discipline[]) => void;
}) {
  const selected = value.filter((discipline) =>
    (disciplines as readonly string[]).includes(discipline)
  );
  const unselected = disciplines.filter((discipline) => !selected.includes(discipline));
  const canReorder = selected.length > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function toggle(discipline: Discipline, checked: boolean) {
    onChange(
      checked
        ? [...selected, discipline]
        : selected.filter((item) => item !== discipline)
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selected.indexOf(active.id as Discipline);
    const newIndex = selected.indexOf(over.id as Discipline);
    if (oldIndex < 0 || newIndex < 0) return;

    onChange(arrayMove(selected, oldIndex, newIndex));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Tick what you do. Drag ticked disciplines to reorder. The first one is
        the icon next to your name.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <ul className="overflow-hidden rounded-xl border border-border/80">
          <SortableContext
            items={selected}
            strategy={verticalListSortingStrategy}
          >
            {selected.map((discipline, index) => (
              <SortableDisciplineRow
                key={discipline}
                discipline={discipline}
                first={index === 0}
                sortable={canReorder}
                onToggle={(checked) => toggle(discipline, checked)}
              />
            ))}
          </SortableContext>
          {unselected.map((discipline) => (
            <DisciplineRow
              key={discipline}
              discipline={discipline}
              selected={false}
              first={false}
              reserveGrip={canReorder}
              onToggle={(checked) => toggle(discipline, checked)}
            />
          ))}
        </ul>
      </DndContext>
    </div>
  );
}

function SortableDisciplineRow({
  discipline,
  first,
  sortable,
  onToggle,
}: {
  discipline: Discipline;
  first: boolean;
  sortable: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: discipline,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <DisciplineRow
      ref={setNodeRef}
      style={style}
      discipline={discipline}
      selected
      first={first}
      dragging={isDragging}
      sortable={sortable}
      gripRef={setActivatorNodeRef}
      gripListeners={sortable ? listeners : undefined}
      gripAttributes={sortable ? attributes : undefined}
      onToggle={onToggle}
    />
  );
}

const DisciplineRow = forwardRef(function DisciplineRow(
  {
    style,
    discipline,
    selected,
    first,
    reserveGrip = false,
    dragging = false,
    sortable = false,
    gripRef,
    gripListeners,
    gripAttributes,
    onToggle,
  }: {
    style?: CSSProperties;
    discipline: Discipline;
    selected: boolean;
    first: boolean;
    reserveGrip?: boolean;
    dragging?: boolean;
    sortable?: boolean;
    gripRef?: (node: HTMLButtonElement | null) => void;
    gripListeners?: ReturnType<typeof useSortable>["listeners"];
    gripAttributes?: ReturnType<typeof useSortable>["attributes"];
    onToggle: (checked: boolean) => void;
  },
  ref: Ref<HTMLLIElement>
) {
  const label = disciplineLabels[discipline];
  const showGrip = sortable && selected;

  return (
    <li
      ref={ref}
      style={style}
      className={cn(
        "flex items-center border-t border-border/70 first:border-t-0",
        selected && "bg-muted/30",
        first && "bg-muted/50",
        dragging && "relative z-10 bg-background shadow-md",
      )}
    >
      {showGrip ? (
        <button
          type="button"
          ref={gripRef}
          {...gripListeners}
          {...gripAttributes}
          aria-label={`Reorder ${label}`}
          className="ml-1 flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-background/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      ) : reserveGrip ? (
        <span className="ml-1 size-8 shrink-0" aria-hidden />
      ) : null}
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-2.5 pr-3">
        <ChoiceControl
          className="mt-0"
          checked={selected}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <DisciplineIcon
          icon={discipline}
          labelled
          size="md"
          className={selected ? "text-foreground" : "text-muted-foreground"}
        />
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate text-sm",
              !selected && "text-muted-foreground",
            )}
          >
            {label}
          </span>
          {first ? (
            <span className="block text-[11px] leading-tight text-muted-foreground">
              Next to your name
            </span>
          ) : null}
        </span>
      </label>
    </li>
  );
});
