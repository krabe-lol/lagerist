import TemplateFieldsForm, { type TemplateOption } from "@/components/TemplateFieldsForm";
import ItemParentPicker, {
  type ContainerOption,
  type ItemOption,
} from "@/components/ItemParentPicker";
import { createItemAction, updateItemAction } from "@/app/items/actions";
import type { TemplateFieldDef } from "@/lib/constants";

interface ExistingItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  containerId: string | null;
  parentItemId: string | null;
  templateId: string | null;
  customFields: unknown;
}

export default function ItemForm({
  mode,
  item,
  containerOptions,
  itemOptions,
  templates,
  initialTags,
  initialContainerId,
  initialParentItemId,
}: {
  mode: "new" | "edit";
  item?: ExistingItem;
  containerOptions: ContainerOption[];
  itemOptions: ItemOption[];
  templates: { id: string; name: string; fields: TemplateFieldDef[] }[];
  initialTags: string[];
  initialContainerId?: string;
  initialParentItemId?: string;
}) {
  const action = mode === "new" ? createItemAction : updateItemAction;
  const parentKind: "container" | "item" =
    (item?.parentItemId ?? initialParentItemId) ? "item" : "container";

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      {mode === "edit" && item && <input type="hidden" name="id" value={item.id} />}

      <label className="form-control">
        <span className="label-text mb-1">Name</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={item?.name}
          className="input input-bordered"
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1">Beschreibung</span>
        <textarea
          name="description"
          defaultValue={item?.description ?? ""}
          className="textarea textarea-bordered"
          rows={3}
        />
      </label>

      <label className="form-control max-w-32">
        <span className="label-text mb-1">Menge</span>
        <input
          type="number"
          name="quantity"
          min={1}
          defaultValue={item?.quantity ?? 1}
          className="input input-bordered"
        />
      </label>

      <div>
        <span className="label-text mb-1 block">Ort</span>
        <ItemParentPicker
          containers={containerOptions}
          items={itemOptions}
          initialParentKind={parentKind}
          initialContainerId={item?.containerId ?? initialContainerId}
          initialParentItemId={item?.parentItemId ?? initialParentItemId}
        />
      </div>

      <label className="form-control">
        <span className="label-text mb-1">Tags (durch Komma getrennt)</span>
        <input
          type="text"
          name="tags"
          defaultValue={initialTags.join(", ")}
          placeholder="z. B. elektronik, kabel"
          className="input input-bordered"
        />
      </label>

      <TemplateFieldsForm
        templates={templates as TemplateOption[]}
        initialTemplateId={item?.templateId}
        initialCustomFields={item?.customFields as Record<string, string> | undefined}
      />

      <button type="submit" className="btn btn-primary self-start">
        {mode === "new" ? "Item anlegen" : "Speichern"}
      </button>
    </form>
  );
}
