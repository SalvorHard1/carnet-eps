/* ---------- Notes › « 📋 Reporter mes notes sur École Directe » ----------
   Copie les notes d'une évaluation dans le presse-papiers de l'ordinateur, pour l'extension « Passerelle » :
   elle les remet dans l'ordre de la grille d'École Directe et ne laisse que les notes à coller.
   Rien n'est envoyé : l'enseignant colle et enregistre lui-même dans École Directe. */

const FORMAT_VERS_ED = 'carnet-eps-ecole-directe';
// École Directe ne connaît que Abs, Disp et NE : les autres codes du carnet deviennent NE.
const CODES_VERS_ED = { ABS: 'Abs', DISP: 'Disp', NE: 'NE', BLE: 'NE', MAL: 'NE', AUT: 'NE', NR: 'NE' };

function noteVersEcoleDirecte(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (CODES_VERS_ED[v]) return CODES_VERS_ED[v];
  return nombre(v) === null ? '' : affichage(String(v));
}

// Le texte copié est illisible à l'œil : un collage par erreur ne montre ni nom ni note.
// (Simple codage, pas un chiffrement : l'extension le relit sans mot de passe.)
// Version de l'extension Passerelle livrée avec cette version du Carnet (passerelle.zip).
// Mise à jour toute seule par emballer.ps1. L'extension la compare à la sienne et signale qu'elle est en retard.
const VERSION_PASSERELLE = '0.17.0';

function coderVersEcoleDirecte(donnees) {
  let binaire = '';
  const avecVersion = { ...donnees, passerelle: VERSION_PASSERELLE };
  for (const octet of new TextEncoder().encode(JSON.stringify(avecVersion))) binaire += String.fromCharCode(octet);
  return 'CARNET-EPS:' + btoa(binaire);
}

function texteVersEcoleDirecte(c, e) {
  return coderVersEcoleDirecte({
    format: FORMAT_VERS_ED,
    version: 1,
    classe: c.nom,
    evaluation: e.titre,
    max: e.max,
    date: e.date || '',
    eleves: elevesDe(c.id).map(el => ({ nom: el.nom, prenom: el.prenom, note: noteVersEcoleDirecte(Donnees.note(e.id, el.id)) })),
  });
}

// ✍ Appréciations › Reporter sur École Directe : toutes les appréciations de la période, codées de la même façon.
async function apprVersEcoleDirecte(c, periode, eleves, r) {
  const p = periodesAnnee().find(x => x.id === periode);
  if (!p) return 'Choisis d’abord un trimestre : École Directe saisit par période.';
  const fiches = eleves.map(el => {
    const a = appreciationEleve(el, periode, eleves, r);
    return { nom: el.nom, prenom: el.prenom, appreciation: a.texte, manuel: a.manuel };
  });
  const texte = coderVersEcoleDirecte({
    format: 'carnet-eps-appreciations',
    version: 1,
    classe: c.nom,
    periode: p.code,
    eleves: fiches.map(({ nom, prenom, appreciation }) => ({ nom, prenom, appreciation })),
  });
  try { await navigator.clipboard.writeText(texte); }
  catch {
    const t = document.createElement('textarea');
    t.value = texte; document.body.append(t); t.select();
    document.execCommand('copy'); t.remove();
  }
  const aRelire = fiches.filter(f => !f.manuel).length;
  return `${fiches.length} appréciations prêtes ✔${aRelire ? ` (${aRelire} proposées par l’appli, à relire)` : ''}. Ne colle pas encore : clique d’abord sur l’icône de Passerelle, dans École Directe.`;
}

async function versEcoleDirecte() {
  const c = classeActive();
  if (!c) return;
  const evals = evalsDeColonne(evalsDe(c.id), periodeAffichee()).filter(e => !sansNoteEval(e)).reverse();
  if (!evals.length) { toast('Aucune évaluation à copier sur cette période.', 'erreur'); return; }
  const { resultat } = ouvrirModale('📋 Reporter mes notes sur École Directe', `
    <p class="vers-ed-avis">⚠ <b>Nécessite l’extension Passerelle.</b> Pas encore installée ? Ferme cette fenêtre et clique sur le bouton puzzle, en bas à gauche.</p>
    <p class="aide">Choisis l’évaluation à copier. Ensuite, dans École Directe : ouvre le devoir et clique sur l’icône de Passerelle.</p>
    <div class="liste-vers-ed">
      ${evals.map(e => `<button type="submit" value="${esc(e.id)}"><b>${esc(e.titre)}</b>
        <span class="aide">${e.date ? dateCourte(e.date) + ' · ' : ''}/${fmt(e.max)}</span></button>`).join('')}
    </div>`, '<button type="button" data-fermer>Annuler</button>');
  const r = await resultat;
  const e = evals.find(x => x.id === r.action);
  if (!e) return;
  const texte = texteVersEcoleDirecte(c, e);
  try { await navigator.clipboard.writeText(texte); }
  catch {
    const t = document.createElement('textarea');
    t.value = texte; document.body.append(t); t.select();
    document.execCommand('copy'); t.remove();
  }
  toast(`« ${e.titre} » prête ✔ Ne colle pas encore : clique d’abord sur l’icône de Passerelle, dans École Directe.`, 'ok', 8000);
}
