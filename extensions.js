/* ---------- Bouton puzzle (bas à gauche) : les extensions du carnet ----------
   Le paquet fait partie de l'appli, mais reste passif : il ne s'exécute jamais dans le carnet.
   Un clic le télécharge, puis l'enseignant l'ajoute lui-même au navigateur en suivant le guide. Rien n'est envoyé. */

const EXTENSIONS = [
  {
    nom: 'Passerelle',
    texte: 'Prépare les notes et les appréciations du carnet pour École Directe, face aux bons élèves. C’est toi qui colles et qui enregistres.',
    fichier: 'passerelle.zip',
    guide: 'guide-passerelle.pdf',
  },
];

const ICONE_PUZZLE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>';

// Adresse de la page des extensions du navigateur utilisé (par défaut, celle de Chrome, comprise par Brave et Opera).
function adresseExtensions() {
  const ua = navigator.userAgent;
  if (/\bEdg\//.test(ua)) return 'edge://extensions';
  if (/\bOPR\//.test(ua)) return 'opera://extensions';
  return 'chrome://extensions';
}

function ouvrirExtensions() {
  const adresse = adresseExtensions();
  const cartes = EXTENSIONS.map(ext => `
    <div class="extension-carte">
      <span class="extension-logo">${ICONE_PUZZLE}</span>
      <div class="extension-texte"><b>${esc(ext.nom)}</b><span class="aide">${esc(ext.texte)}</span></div>
      <div class="extension-boutons">
        <a class="extension-telecharger primaire" href="${esc(ext.fichier)}" download>Télécharger</a>
        <a class="extension-telecharger extension-guide" href="${esc(ext.guide)}" download>Guide PDF</a>
      </div>
    </div>`).join('');
  const guide = `<h3>Pour l’ajouter à ton navigateur, sur ordinateur</h3>
    <ol class="extension-etapes">
      <li>Clique sur <b>Télécharger</b>.</li>
      <li>Dans tes téléchargements, fais un clic droit sur le fichier, puis <b>Extraire tout</b>.</li>
      <li>Ouvre la page des extensions de ton navigateur : <code>${esc(adresse)}</code> <button type="button" class="extension-copier">Copier l’adresse</button></li>
      <li>Active le <b>Mode développeur</b>.</li>
      <li>Clique sur <b>Charger l’extension décompressée</b> (ou « non empaquetée ») et choisis le dossier <b>passerelle</b>.</li>
      <li>Épingle <b>Passerelle</b> avec le puzzle du navigateur, en haut à droite.</li>
    </ol>
    <p class="aide">Pour Edge, Chrome, Brave et Opera. Firefox et Safari ne sont pas pris en charge. Ne déplace pas le dossier ensuite : le navigateur en a besoin. Le <b>Guide PDF</b> détaille l’installation et l’utilisation.</p>`;
  const { d } = ouvrirModale('Extensions', cartes + guide, '<button type="button" data-fermer>Fermer</button>', 'modale-extensions');
  const copier = $('.extension-copier', d);
  copier.addEventListener('click', async () => {
    let copie = true;
    try { await navigator.clipboard.writeText(adresse); }
    catch {
      const t = document.createElement('textarea');
      t.value = adresse; d.append(t); t.select();
      copie = document.execCommand('copy'); t.remove();
    }
    copier.textContent = copie ? 'Copié ✔' : 'Copie impossible';
  });
}

(() => {
  const b = document.createElement('button');
  b.id = 'extensions-bouton'; b.type = 'button';
  b.title = 'Extensions'; b.setAttribute('aria-label', 'Extensions');
  b.innerHTML = ICONE_PUZZLE;
  b.addEventListener('click', ouvrirExtensions);
  document.body.append(b);
})();
