import type { CatalogSong } from './types';
import solNaciente from './songs/sol-naciente';
import greensleeves from './songs/greensleeves';
import romance from './songs/romance';
import bluesLa from './songs/blues-la';
import odaAlegria from './songs/oda-alegria';
import canonRe from './songs/canon-re';
import rockMi from './songs/rock-mi';
import galopeMi from './songs/galope-mi';
import dropdSincopado from './songs/dropd-sincopado';
import octavasFuzz from './songs/octavas-fuzz';
import guitarrasEntrelazadas from './songs/guitarras-entrelazadas';
import punkRapido from './songs/punk-rapido';
import funkNovenas from './songs/funk-novenas';
import rasgueoCejilla from './songs/rasgueo-cejilla';

export type { CatalogSong, Level, SongMeta } from './types';

export const CATALOG: CatalogSong[] = [
  solNaciente,
  greensleeves,
  romance,
  bluesLa,
  odaAlegria,
  canonRe,
  rockMi,
  punkRapido,
  rasgueoCejilla,
  guitarrasEntrelazadas,
  octavasFuzz,
  funkNovenas,
  dropdSincopado,
  galopeMi,
];
