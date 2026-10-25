import { Layers } from 'lucide-react';
import type { Card } from '../lib/types';

export default function CardPicture({card}:{card:Card}) {
 return card.image?<img className="tcg-image" src={card.image} alt={card.name} loading="lazy"/>:<span className="card-placeholder" role="img" aria-label={`No picture for ${card.name}`}><span className="placeholder-frame"><Layers size={38} strokeWidth={1.2}/><strong>{card.name}</strong><span>Picture not added</span></span></span>;
}
