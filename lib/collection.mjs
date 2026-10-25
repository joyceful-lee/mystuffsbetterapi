export function allFavorites(binders) {
  return allCards(binders).filter(entry=>entry.card.favorite);
}
export function allCards(binders){return binders.flatMap(binder=>binder.cards.map(card=>({card,binder})));}
export function reorderItems(items, ids) {
  const byId = new Map(items.map(item=>[item.id,item]));
  if (ids.length !== items.length || new Set(ids).size !== ids.length || ids.some(id=>!byId.has(id))) throw new Error('The collection changed. Close this window and try again.');
  return ids.map(id=>byId.get(id));
}
export function coverCard(binder) {
  return binder.cards.find(card=>card.id===binder.coverCardId) || binder.cards[0] || null;
}
