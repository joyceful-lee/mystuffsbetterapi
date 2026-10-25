export type Card = { id: string; name: string; image: string; deck: string; cardNumber: string; rarity: string; favorite: boolean };
export type Binder = { id: string; name: string; game: string; color: string; backgroundColor: string; bio: string; theme: string; coverCardId: string | null; cards: Card[]; shareToken: string | null };
export type User = { id: string; name: string; email: string };
