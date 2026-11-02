"use client";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "./client-api";

export type ProofItem = { photoId: string; hearted: boolean; comment: string | null };
export type ProofState = { maxSelections: number | null; me: { name: string; email: string; status: string; items: ProofItem[] } | null };

const derive = (s: ProofState) => {
  const items = new Map((s.me?.items || []).map((i) => [i.photoId, i]));
  return { items, count: [...items.values()].filter((i) => i.hearted).length, locked: s.me?.status === "submitted" };
};

// Client-side proofing state: hearts, comments, identity and submission for one gallery.
export function useProofing(slug: string, initial: ProofState) {
  const [state, setStateRaw] = useState(initial);
  const ref = useRef(initial);
  const setState = (fn: (s: ProofState) => ProofState) => setStateRaw(() => (ref.current = fn(ref.current)));
  const [askIdentity, setAskIdentity] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const { items, count, locked } = useMemo(() => derive(state), [state]);
  const max = state.maxSelections;

  const patchItem = (item: ProofItem) =>
    setState((s) => (s.me ? { ...s, me: { ...s.me, items: [...s.me.items.filter((i) => i.photoId !== item.photoId), item] } } : s));

  function needIdentity(then: () => void) {
    if (ref.current.me) return false;
    pending.current = then;
    setAskIdentity(true);
    return true;
  }

  async function identify(name: string, email: string) {
    const next = await api<ProofState>(`/api/g/${slug}/proofing`, { method: "POST", body: { name, email } });
    setState(() => next);
    setAskIdentity(false);
    toast.success(`Thanks, ${next.me!.name.split(" ")[0]}! Tap the heart on your favorites.`);
    const then = pending.current;
    pending.current = null;
    if (then && next.me?.status !== "submitted") then();
  }

  async function save(photoId: string, body: { hearted?: boolean; comment?: string }) {
    const prev = derive(ref.current).items.get(photoId) || { photoId, hearted: false, comment: null };
    patchItem({ ...prev, ...body, comment: body.comment !== undefined ? body.comment.trim() || null : prev.comment });
    try {
      const r = await api<ProofItem>(`/api/g/${slug}/proofing/items/${photoId}`, { method: "PUT", body });
      patchItem({ photoId, hearted: r.hearted, comment: r.comment });
      return true;
    } catch (e) {
      patchItem(prev);
      toast.error((e as Error).message, { duration: 6000 });
      return false;
    }
  }

  function toggleHeart(photoId: string) {
    if (needIdentity(() => toggleHeart(photoId))) return;
    const cur = derive(ref.current);
    if (cur.locked) return toast.message("Your selections are submitted. Ask your photographer to reopen them if you'd like changes.");
    const hearted = !!cur.items.get(photoId)?.hearted;
    const limit = ref.current.maxSelections;
    if (!hearted && limit && cur.count >= limit) {
      return toast.error(`You've picked ${limit} of ${limit} — that's the limit for this gallery. Remove a heart from another photo to choose this one instead.`, { duration: 6000 });
    }
    save(photoId, { hearted: !hearted });
  }

  const saveComment = (photoId: string, comment: string) => save(photoId, { comment });

  async function submit() {
    const r = await api<{ message: string }>(`/api/g/${slug}/proofing/submit`, { method: "POST" });
    setState((s) => (s.me ? { ...s, me: { ...s.me, status: "submitted" } } : s));
    return r.message;
  }

  return { state, items, count, max, locked, askIdentity, setAskIdentity, needIdentity, identify, toggleHeart, saveComment, submit };
}

export type Proofing = ReturnType<typeof useProofing>;
