import { useState, useMemo } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { type Customer } from '../db/db';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const COLUMNS = [
  { id: 'Khách mới', title: 'Khách mới' },
  { id: 'Đã liên hệ', title: 'Đã liên hệ' },
  { id: 'Đang tư vấn', title: 'Đang tư vấn' },
  { id: 'Hẹn chốt', title: 'Hẹn chốt' },
  { id: 'Đã mua', title: 'Đã mua' },
  { id: 'Chăm sóc lại', title: 'Chăm sóc lại' },
  { id: 'Mất khách', title: 'Mất khách' },
];

function SortableCustomerCard({ customer }: { customer: Customer }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: customer.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors ${
        isDragging ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-800 text-sm">{customer.name}</h4>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          customer.lead_temperature === 'Nóng' ? 'bg-red-100 text-red-700' :
          customer.lead_temperature === 'Ấm' ? 'bg-orange-100 text-orange-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {customer.lead_temperature}
        </span>
      </div>
      <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
        <Phone className="w-3 h-3" />
        {customer.phone}
      </div>
      <div className="flex justify-between items-center text-[10px]">
        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
          {customer.source}
        </span>
        {customer.expected_repurchase_date && (
          <span className="flex items-center gap-1 text-slate-500">
            <Calendar className="w-3 h-3" />
            {format(parseISO(customer.expected_repurchase_date), 'dd/MM')}
          </span>
        )}
      </div>
    </div>
  );
}

function Column({ id, title, customers }: { id: string, title: string, customers: Customer[] }) {
  const { setNodeRef } = useSortable({ id, data: { type: 'Column' } });

  return (
    <div className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 w-72 shrink-0 h-full max-h-[calc(100vh-140px)]">
      <div className="p-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center bg-slate-100/50 rounded-t-xl">
        {title}
        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{customers.length}</span>
      </div>
      <div ref={setNodeRef} className="p-2 flex-1 overflow-y-auto space-y-2">
        <SortableContext items={customers.map(c => c.id!)}>
          {customers.map(c => (
            <SortableCustomerCard key={c.id} customer={c} />
          ))}
        </SortableContext>
        {customers.length === 0 && (
          <div className="h-20 flex items-center justify-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
            Thả vào đây
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const { data: customers = [] } = useSupabaseQuery<any>({ table: 'customers' });
  const customerMutation = useSupabaseMutation('customers');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const customer = customers.find(c => c.id === active.id);
    if (customer) setActiveCustomer(customer);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCustomer(null);

    if (!over) return;

    const customerId = active.id as number;
    const overId = over.id;

    // Check if dragging over a column
    const isOverColumn = COLUMNS.some(col => col.id === overId);
    
    // Check if dragging over another card
    const overCustomer = customers.find(c => c.id === overId);

    let newStatus = '';

    if (isOverColumn) {
      newStatus = overId as string;
    } else if (overCustomer) {
      newStatus = overCustomer.status;
    }

    const currentCustomer = customers.find((c: any) => c.id === customerId);
    if (currentCustomer && newStatus && currentCustomer.status !== newStatus) {
      // Update DB
      await customerMutation.update(customerId, { status: newStatus });
    }
  };

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="mb-4 flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Pipeline</h1>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {COLUMNS.map(col => (
              <Column 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                customers={customers.filter(c => c.status === col.id)} 
              />
            ))}
          </div>

          <DragOverlay>
            {activeCustomer ? (
              <div className="opacity-80 rotate-3 cursor-grabbing">
                <SortableCustomerCard customer={activeCustomer} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
