import { useState, type FormEvent, type ReactElement } from "react";

export type FieldDef = { key: string; label: string; unit?: string; step?: string };
export type PresetItem = { id: string; name: string } & Record<string, unknown>;

export function PresetPage(props: {
  title: string;
  items: PresetItem[];
  fields: FieldDef[];
  schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } } };
  onSave: (item: PresetItem) => void;
  onDelete: (id: string) => void;
}): ReactElement {
  const { title, items, fields, schema, onSave, onDelete } = props;
  const [editing, setEditing] = useState<PresetItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  function openAdd() {
    const newItem: PresetItem = { id: crypto.randomUUID(), name: "" };
    for (const f of fields) newItem[f.key] = "";
    setEditing(newItem);
    setFormValues({ name: "", ...Object.fromEntries(fields.map((f) => [f.key, ""])) });
    setErrors([]);
  }

  function openEdit(item: PresetItem) {
    setEditing(item);
    const vals: Record<string, string> = { name: item.name };
    for (const f of fields) vals[f.key] = String(item[f.key] || "");
    setFormValues(vals);
    setErrors([]);
  }

  function closeForm() {
    setEditing(null);
    setFormValues({});
    setErrors([]);
  }

  function handleDelete(item: PresetItem) {
    if (window.confirm("Delete " + item.name + "?")) {
      onDelete(item.id);
      if (editing && editing.id === item.id) closeForm();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const obj: Record<string, unknown> = { id: editing.id, name: formValues.name };
    for (const f of fields) {
      const raw = formValues[f.key];
      obj[f.key] = raw === "" ? NaN : Number(raw);
    }
    const result = schema.safeParse(obj);
    if (!result.success) {
      setErrors((result.error?.issues ?? []).map((i) => `${i.path.join(".") || "form"}: ${i.message}`));
      return;
    }
    setErrors([]);
    onSave(obj as PresetItem);
    closeForm();
  }

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
        <button className="button" onClick={openAdd}>Add</button>
      </div>
      {items.length === 0 ? (
        <p className="empty-state">No items yet. Add one to start.</p>
      ) : (
        <table className="preset-table">
          <thead>
            <tr>
              <th>Name</th>
              {fields.map((f) => <th key={f.key} className="num">{f.label}</th>)}
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                {fields.map((f) => (
                  <td key={f.key} className="num" data-label={f.label}>{String(item[f.key])}</td>
                ))}
                <td className="actions">
                  <button className="link-button" onClick={() => openEdit(item)}>Edit</button>{" "}
                  <button className="link-button" onClick={() => handleDelete(item)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing && (
        <form className="card edit-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label>
              Name
              <input type="text" value={formValues.name ?? ""} onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))} />
            </label>
            {fields.map((f) => (
              <label key={f.key}>
                {f.label}
                <span className="input-with-unit">
                  <input
                    type="number"
                    step={f.step ?? "any"}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                  {f.unit ? <span className="unit">{f.unit}</span> : null}
                </span>
              </label>
            ))}
          </div>
          {errors.length > 0 && (
            <ul role="alert">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" className="link-button" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}
    </>
  );
}
