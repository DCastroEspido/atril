import type { CatalogSong } from './types';
import solNaciente from './songs/sol-naciente';
import greensleeves from './songs/greensleeves';
import romance from './songs/romance';
import bluesLa from './songs/blues-la';
import odaAlegria from './songs/oda-alegria';
import canonRe from './songs/canon-re';
import rockMi from './songs/rock-mi';

export type { CatalogSong, Level, SongMeta } from './types';

export const CATALOG: CatalogSong[] = [solNaciente, greensleeves, romance, bluesLa, odaAlegria, canonRe, rockMi];
