import {test} from 'node:test';
import assert from 'node:assert/strict';
import {backgroundColors,binderColors,binderThemes,paletteFor,GUEST_CARD_LIMIT,GUEST_IMAGE_DATA_LIMIT,IMPORT_BATCH_SIZE,isRarityForGame,raritiesFor,rarityRank} from '../lib/binder-config.mjs';
test('rarity choices match the selected game instead of sharing Pokémon labels',()=>{
 assert.ok(isRarityForGame('Pokémon','Special illustration rare'));
 assert.ok(isRarityForGame('Magic','Mythic rare'));
 assert.ok(isRarityForGame('Yu-Gi-Oh!','Quarter century secret rare'));
 assert.ok(isRarityForGame('One Piece','Leader'));
 assert.ok(isRarityForGame('One Piece','Treasure rare'));
 assert.equal(isRarityForGame('Magic','Ultra rare'),false);
 assert.equal(isRarityForGame('Yu-Gi-Oh!','Mythic rare'),false);
 assert.equal(isRarityForGame('Pokémon','Leader'),false);
 assert.deepEqual(raritiesFor('Unknown game'),raritiesFor('Other'));
});
test('rarity sorting uses each game’s order and handles older labels',()=>{assert.ok(rarityRank('Magic','Mythic rare')>rarityRank('Magic','Common'));assert.equal(rarityRank('Magic','Ultra rare'),-1);});
test('themes offer short valid palettes and preserve existing saved colors',()=>{for(const theme of ['pastel','vibrant','neon','gamer','classic']){assert.ok(binderThemes[theme]);const palette=paletteFor(theme);assert.equal(palette.length,4);assert.ok(palette.every(color=>binderColors.includes(color)&&backgroundColors.includes(color)));}assert.ok(paletteFor('pastel','black').includes('black'));assert.equal(paletteFor('pastel','black').length,5);assert.equal(paletteFor('neon','lime').length,4);});
test('only Other accepts custom rarity names, with nonempty length limits',()=>{assert.ok(isRarityForGame('Other','Event exclusive'));assert.ok(isRarityForGame('Other','A'.repeat(60)));assert.equal(isRarityForGame('Other','A'.repeat(61)),false);assert.equal(isRarityForGame('Other','   '),false);assert.equal(isRarityForGame('Magic','Event exclusive'),false);});
test('guest images and import batches fit browser and request limits at 50 cards',()=>{assert.equal(GUEST_CARD_LIMIT,50);assert.ok(GUEST_IMAGE_DATA_LIMIT*GUEST_CARD_LIMIT*2<4500000);assert.ok(IMPORT_BATCH_SIZE*350000<4200000);});
