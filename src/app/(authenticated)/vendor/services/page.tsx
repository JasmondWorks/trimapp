"use client";


import { useState } from "react";
import { useMyServices, useManageServices } from "@/models/service/service.hooks";
import { DEFAULT_SERVICE_DURATION_MINUTES } from "@/models/service/service.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default VendorServices;

const EMPTY_SERVICE_FORM = {
  name: "",
  price: "",
  duration: String(DEFAULT_SERVICE_DURATION_MINUTES),
  description: "",
};

function VendorServices() {
  const { services } = useMyServices();
  const { createService, deleteService, isSaving } = useManageServices();

  const [form, setForm] = useState(EMPTY_SERVICE_FORM);

  const handleAdd = async () => {
    try {
      await createService({
        name: form.name,
        price: form.price,
        duration_minutes: form.duration,
        description: form.description,
      });
      toast.success("Service added");
      setForm(EMPTY_SERVICE_FORM);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h1 className="font-display text-2xl mb-4">Your services</h1>
        {services?.length ? (
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="rounded-md border border-border p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.duration_minutes} min · {formatNaira(s.price)}</p>
                </div>
                <button onClick={() => void handleDelete(s.id)} aria-label="delete"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No services yet.</p>}
      </div>

      <form className="rounded-lg border border-border bg-card p-5 space-y-3 h-fit"
        onSubmit={(e) => { e.preventDefault(); void handleAdd(); }}>
        <h2 className="font-display text-xl">Add service</h2>
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Price (₦)</Label><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
          <div><Label>Duration (min)</Label><Input type="number" min={5} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
        </div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <Button type="submit" disabled={isSaving} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">{isSaving ? "Adding…" : "Add"}</Button>
      </form>
    </div>
  );
}
