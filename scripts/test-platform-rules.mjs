import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
const env = await initializeTestEnvironment({
  projectId: "demo-lifi-platform",
  firestore: {
    rules: await readFile("firestore.rules", "utf8"),
    host: "127.0.0.1",
    port: 8085,
  },
});
const user = (uid, email, extra = {}) =>
  env
    .authenticatedContext(uid, { email, email_verified: true, ...extra })
    .firestore();
const root = user("root", "owner@example.com", { staff: true }),
  admin = user("admin", "admin@example.com"),
  editor = user("editor", "editor@example.com"),
  club = user("club", "club@example.com"),
  other = user("outsider", "outsider@example.com"),
  anon = env.unauthenticatedContext().firestore();
const base = "organizations/liga-sur";
async function write(db, path, data, previous = null) {
  const version = previous === null ? 0 : previous.version + 1;
  const auditId = "test-" + crypto.randomUUID();
  const actor =
    db === root
      ? "root"
      : db === admin
        ? "admin"
        : db === editor
          ? "editor"
          : db === club
            ? "club"
            : "outsider";
  const payload = {
    ...data,
    version,
    updatedBy: actor,
    updatedAt: serverTimestamp(),
    auditId,
  };
  const batch = writeBatch(db);
  batch.set(doc(db, path), payload);
  batch.set(doc(db, base, "audits", auditId), {
    path,
    action: "saved",
    version,
    actor,
    at: serverTimestamp(),
    previous,
    next: payload,
  });
  return batch.commit();
}
try {
  await env.clearFirestore();
  const batch = writeBatch(root);
  batch.set(doc(root, base), {
    id: "liga-sur",
    name: "Liga Sur",
    contactEmail: "liga@example.com",
    color: "#126551",
    ownerUid: "root",
    createdAt: serverTimestamp(),
  });
  batch.set(doc(root, base, "members", "owner@example.com"), {
    email: "owner@example.com",
    role: "admin",
    teamId: "",
    active: true,
  });
  await assertSucceeds(batch.commit());
  for (const [email, role, teamId] of [
    ["admin@example.com", "admin", ""],
    ["editor@example.com", "editor", ""],
    ["club@example.com", "club", "club-uno"],
  ])
    await assertSucceeds(
      setDoc(doc(root, base, "members", email), {
        email,
        role,
        teamId,
        active: true,
      }),
    );
  await assertFails(
    setDoc(doc(other, base, "members", "outsider@example.com"), {
      email: "outsider@example.com",
      role: "admin",
      teamId: "",
      active: true,
    }),
  );
  await assertFails(
    setDoc(doc(editor, base, "members", "editor@example.com"), {
      email: "editor@example.com",
      role: "admin",
      teamId: "",
      active: true,
    }),
  );
  const season = { id: "season-2027", name: "Apertura 2027", archived: false };
  await assertSucceeds(write(admin, `${base}/seasons/season-2027`, season));
  const tournament = {
    id: "cup-2027",
    name: "Copa 2027",
    seasonId: "season-2027",
    categories: ["Mini"],
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    published: false,
  };
  const tp = `${base}/tournaments/cup-2027`;
  await assertSucceeds(write(admin, tp, tournament));
  await assertFails(getDoc(doc(anon, tp)));
  await assertFails(getDoc(doc(other, tp)));
  for (const id of ["club-uno", "club-dos"])
    await assertSucceeds(
      write(admin, `${tp}/teams/${id}`, {
        id,
        name: id,
        category: "Mini",
        deleted: false,
      }),
    );
  const fixture = {
    id: "match-one",
    category: "Mini",
    home: "club-uno",
    away: "club-dos",
    round: 1,
    date: "2027-03-01",
    time: "12:00",
    venue: "Cancha",
    status: "played",
    homeScore: 2,
    awayScore: 0,
    deleted: false,
  };
  await assertSucceeds(write(editor, `${tp}/matches/match-one`, fixture));
  await assertFails(
    write(club, `${tp}/matches/match-club`, { ...fixture, id: "match-club" }),
  );
  await assertFails(
    write(other, `${tp}/matches/match-other`, {
      ...fixture,
      id: "match-other",
    }),
  );
  await assertFails(
    write(editor, `${tp}/matches/match-invalid`, {
      ...fixture,
      id: "match-invalid",
      homeScore: -1,
    }),
  );
  await assertFails(
    write(editor, `${tp}/matches/match-team`, {
      ...fixture,
      id: "match-team",
      away: "foreign-team",
    }),
  );
  const existing = (
    await getDoc(doc(editor, tp, "matches", "match-one"))
  ).data();
  await assertSucceeds(
    write(
      editor,
      `${tp}/matches/match-one`,
      { ...fixture, homeScore: 3 },
      existing,
    ),
  );
  await assertFails(
    write(editor, `${tp}/matches/match-one`, fixture, existing),
  );
  const player = {
    id: "player-one",
    name: "Jugador Uno",
    teamId: "club-uno",
    category: "Mini",
    published: false,
    deleted: false,
  };
  await assertSucceeds(write(club, `${tp}/players/player-one`, player));
  await assertFails(
    write(club, `${tp}/players/player-two`, {
      ...player,
      id: "player-two",
      teamId: "club-dos",
    }),
  );
  const oldTournament = (await getDoc(doc(admin, tp))).data();
  await assertSucceeds(
    write(admin, tp, { ...tournament, published: true }, oldTournament),
  );
  await assertSucceeds(getDoc(doc(anon, tp)));
  await assertSucceeds(
    getDocs(
      query(
        collection(anon, base, "tournaments"),
        where("published", "==", true),
      ),
    ),
  );
  await assertFails(getDoc(doc(anon, tp, "players", "player-one")));
  await assertFails(
    setDoc(doc(editor, tp, "matches", "no-audit"), {
      ...fixture,
      id: "no-audit",
      version: 0,
      updatedBy: "editor",
      updatedAt: serverTimestamp(),
      auditId: "missing",
    }),
  );
  const oldSeason = (
    await getDoc(doc(admin, base, "seasons", "season-2027"))
  ).data();
  await assertSucceeds(
    write(
      admin,
      `${base}/seasons/season-2027`,
      { ...season, archived: true },
      oldSeason,
    ),
  );
  await assertFails(
    write(editor, `${tp}/matches/match-archived`, {
      ...fixture,
      id: "match-archived",
    }),
  );
  await assertFails(getDocs(collection(other, base, "audits")));
  await assertSucceeds(
    setDoc(
      doc(
        root,
        "artifacts",
        "lifi-2026-prod",
        "public",
        "data",
        "partidos",
        "legacy-match",
      ),
      { deleted: true, deletedAt: serverTimestamp(), updatedBy: "root" },
    ),
  );
  await assertFails(
    setDoc(
      doc(
        other,
        "artifacts",
        "lifi-2026-prod",
        "public",
        "data",
        "partidos",
        "legacy-match",
      ),
      { deleted: true, deletedAt: serverTimestamp(), updatedBy: "outsider" },
    ),
  );
  console.log(
    "PASS: organization isolation, roles, verified access, results, audit, optimistic concurrency, privacy, archived seasons, tombstones.",
  );
} finally {
  await env.cleanup();
}
