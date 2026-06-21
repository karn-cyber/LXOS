import Event from '@/models/Event';

/**
 * Normalize whatever room fields a request sent into a clean array of room id
 * strings. Accepts `roomIds` (array) and/or legacy single `roomId`.
 */
export function normalizeRoomIds(body) {
    const ids = [];
    if (Array.isArray(body?.roomIds)) ids.push(...body.roomIds);
    if (body?.roomId) ids.push(body.roomId);
    // De-dupe and drop falsy values.
    return [...new Set(ids.filter(Boolean).map(String))];
}

/**
 * Find scheduling conflicts for a set of rooms in a time window. A room is
 * considered taken if any APPROVED/PENDING event overlaps the window and books
 * that room in either its `roomIds` array or its legacy `roomId` field.
 *
 * Returns an array of { roomId, events: [{ _id, title, startDate, endDate }] }.
 */
export async function findRoomConflicts(roomIds, startDate, endDate, excludeEventId = null) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const conflicts = [];

    for (const roomId of roomIds) {
        const query = {
            status: { $in: ['APPROVED', 'PENDING'] },
            $and: [
                { $or: [{ roomIds: roomId }, { roomId }] },
                { startDate: { $lte: end }, endDate: { $gte: start } },
            ],
        };
        if (excludeEventId) query._id = { $ne: excludeEventId };

        const events = await Event.find(query).select('title startDate endDate').lean();
        if (events.length > 0) {
            conflicts.push({
                roomId,
                events: events.map(e => ({
                    _id: e._id.toString(),
                    title: e.title,
                    startDate: e.startDate,
                    endDate: e.endDate,
                })),
            });
        }
    }

    return conflicts;
}
