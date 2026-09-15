export interface PlaceRoomOption {
  id: string;
  name: string;
}

export interface PlaceContainerOption {
  id: string;
  name: string;
  number: number;
  roomName: string;
}

/** An item's "Lage" (place) is either a Room or a Container, listed together in
 * one <select>, grouped under headings via <optgroup>. Option values are
 * encoded as "room:<id>" / "container:<id>" so a single form field can carry
 * either kind. */
export default function PlaceOptions({
  rooms,
  containers,
}: {
  rooms: PlaceRoomOption[];
  containers: PlaceContainerOption[];
}) {
  return (
    <>
      <optgroup label="Räume">
        {rooms.map((r) => (
          <option key={`room:${r.id}`} value={`room:${r.id}`}>
            {r.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Container">
        {containers.map((c) => (
          <option key={`container:${c.id}`} value={`container:${c.id}`}>
            #{c.number} {c.name} ({c.roomName})
          </option>
        ))}
      </optgroup>
    </>
  );
}
