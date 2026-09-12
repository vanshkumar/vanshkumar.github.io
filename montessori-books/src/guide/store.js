// Pure selectors over an explicit public payload. Never import research/drafts here.
export function createGuideStore({ entries, placements, scenes }) {
  const byId = new Map();
  for (const entry of entries) {
    if (byId.has(entry.id)) throw new Error(`Duplicate guide entry: ${entry.id}`);
    byId.set(entry.id, entry);
  }
  const placementIds = new Set();
  const pairs = new Set();
  for (const placement of placements) {
    const pair = `${placement.ageId}/${placement.entryId}`;
    if (!byId.has(placement.entryId) || placementIds.has(placement.id) || pairs.has(pair)) {
      throw new Error(`Invalid or duplicate guide placement: ${placement.id}`);
    }
    placementIds.add(placement.id);
    pairs.add(pair);
  }
  const scenesByAge = new Map();
  for (const scene of scenes) {
    if (scenesByAge.has(scene.ageId)) throw new Error(`Duplicate age scene: ${scene.ageId}`);
    scenesByAge.set(scene.ageId, scene);
  }
  const inAge = age => placements.filter(placement => placement.ageId === age);
  const present = placement => placement ? { entry: byId.get(placement.entryId), placement } : null;

  return {
    entry: id => byId.get(id) ?? null,
    scene: age => scenesByAge.get(age) ?? null,
    forAge: age => inAge(age).map(present),
    forTopic: (age, topic) => inAge(age).filter(placement => placement.topicIds.includes(topic)).map(present),
    openings: age => inAge(age).filter(placement => placement.openingOrder != null)
      .sort((a, b) => a.openingOrder - b.openingOrder).map(present),
    atAge: (id, age, topic = null) => present(inAge(age).find(placement => placement.entryId === id && (!topic || placement.topicIds.includes(topic)))),
    agesFor: id => placements.filter(placement => placement.entryId === id).map(placement => placement.ageId),
  };
}
