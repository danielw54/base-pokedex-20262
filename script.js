// ============================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================

const URL_BASE_POKEMON = "https://pokeapi.co/api/v2/pokemon/";
const URL_BASE_ESPECIE = "https://pokeapi.co/api/v2/pokemon-species/";

const COLORES_TIPO = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD"
};

// Estado actual de la Pokedex (se usa para navegación y shiny)
let datosActuales = null;   // últimos datos de /pokemon
let idActual = null;        // id numérico del pokemon mostrado
let mostrandoShiny = false; // si la imagen actual es shiny o normal

// ============================================================
// REFERENCIAS AL DOM
// ============================================================

const intro = document.getElementById("intro");
const barraCarga = document.getElementById("barraCarga");
const btnStart = document.getElementById("btnStart");
const app = document.getElementById("app");

const inputBusqueda = document.getElementById("inputBusqueda");
const btnBuscar = document.getElementById("btnBuscar");
const mensaje = document.getElementById("mensaje");
const card = document.getElementById("card");

const pokeNombre = document.getElementById("pokeNombre");
const pokeId = document.getElementById("pokeId");
const pokeImagen = document.getElementById("pokeImagen");
const pokeTipos = document.getElementById("pokeTipos");
const pokePeso = document.getElementById("pokePeso");
const pokeAltura = document.getElementById("pokeAltura");
const pokeExperiencia = document.getElementById("pokeExperiencia");
const pokeOrden = document.getElementById("pokeOrden");
const pokeStats = document.getElementById("pokeStats");
const pokeHabilidades = document.getElementById("pokeHabilidades");
const pokeMovimientos = document.getElementById("pokeMovimientos");

const btnNormal = document.getElementById("btnNormal");
const btnShiny = document.getElementById("btnShiny");
const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");

const pokeDescripcion = document.getElementById("pokeDescripcion");
const pokeGeneracion = document.getElementById("pokeGeneracion");
const pokeColor = document.getElementById("pokeColor");
const pokeHabitat = document.getElementById("pokeHabitat");
const pokeEtiquetasEspeciales = document.getElementById("pokeEtiquetasEspeciales");
const chispasContenedor = document.getElementById("chispas");
const cardScreen = document.getElementById("card");

const botonesTab = document.querySelectorAll(".tab-boton");
const panelesTab = document.querySelectorAll(".panel-tab");

// ============================================================
// PANTALLA DE INICIO ESTILO GAME BOY
// ============================================================

function iniciarPantallaCarga() {
  let progreso = 0;
  const intervalo = setInterval(function () {
    progreso += 5;
    barraCarga.style.width = progreso + "%";
    if (progreso >= 100) {
      clearInterval(intervalo);
      btnStart.disabled = false;
    }
  }, 60);
}

function entrarALaApp() {
  intro.style.display = "none";
  app.classList.add("visible");
  inputBusqueda.focus();
}

btnStart.addEventListener("click", entrarALaApp);
iniciarPantallaCarga();

// ============================================================
// BÚSQUEDA PRINCIPAL (fetch + async/await)
// ============================================================

async function buscarPokemon() {
  const termino = inputBusqueda.value.trim().toLowerCase();

  if (termino === "") {
    mostrarMensaje("Escribe un nombre o ID para buscar.");
    ocultarCard();
    return;
  }

  await cargarPokemonPorTermino(termino);
}

// Función reutilizable: recibe nombre o id y trae los datos de la API
async function cargarPokemonPorTermino(termino) {
  mostrarMensaje("Buscando Pokémon...");
  ocultarCard();

  try {
    const respuesta = await fetch(URL_BASE_POKEMON + termino);

    if (!respuesta.ok) {
      mostrarMensaje("Pokémon no encontrado. Verifica el nombre o el ID e inténtalo nuevamente.");
      return;
    }

    const datos = await respuesta.json();

    datosActuales = datos;
    idActual = datos.id;
    mostrandoShiny = false;
    actualizarBotonesSprite();

    mostrarPokemon(datos);
    mostrarMensaje("");

    // La especie se busca aparte, sin bloquear lo que ya se mostró
    buscarEspecie(datos.id);

    // Habilita/inhabilita el botón "Anterior" si estamos en el primer pokemon
    btnAnterior.disabled = idActual <= 1;

  } catch (error) {
    mostrarMensaje("No fue posible conectarse con PokéAPI. Inténtalo nuevamente.");
    console.error("Error al buscar el Pokémon:", error);
  }
}

// ============================================================
// ESPECIE (pokemon-species)
// ============================================================

async function buscarEspecie(id) {
  try {
    const respuesta = await fetch(URL_BASE_ESPECIE + id);

    if (!respuesta.ok) {
      limpiarEspecie();
      return;
    }

    const especie = await respuesta.json();
    mostrarEspecie(especie);

  } catch (error) {
    limpiarEspecie();
    console.error("Error al buscar la especie:", error);
  }
}

function mostrarEspecie(especie) {
  // Descripción: primero en español, si no existe se usa inglés
  const entradas = especie.flavor_text_entries || [];

  let entradaElegida = entradas.find(function (e) {
    return e.language.name === "es";
  });

  if (!entradaElegida) {
    entradaElegida = entradas.find(function (e) {
      return e.language.name === "en";
    });
  }

  if (entradaElegida) {
    const textoLimpio = entradaElegida.flavor_text
      .replace(/\f/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    pokeDescripcion.textContent = textoLimpio;
  } else {
    pokeDescripcion.textContent = "Descripción no disponible.";
  }

  // Generación (ej: "generation-i" -> "I")
  if (especie.generation && especie.generation.name) {
    const partes = especie.generation.name.split("-");
    pokeGeneracion.textContent = partes[1] ? partes[1].toUpperCase() : especie.generation.name;
  } else {
    pokeGeneracion.textContent = "—";
  }

  // Color
  pokeColor.textContent = especie.color && especie.color.name ? especie.color.name : "—";

  // Hábitat (no todos los pokemon lo tienen, ej. algunos legendarios)
  pokeHabitat.textContent = especie.habitat && especie.habitat.name ? especie.habitat.name : "Desconocido";

  // Etiquetas especiales: legendario / mítico
  pokeEtiquetasEspeciales.innerHTML = "";
  if (especie.is_legendary) {
    pokeEtiquetasEspeciales.appendChild(crearEtiquetaEspecial("Legendario"));
  }
  if (especie.is_mythical) {
    pokeEtiquetasEspeciales.appendChild(crearEtiquetaEspecial("Mítico"));
  }
}

function crearEtiquetaEspecial(texto) {
  const span = document.createElement("span");
  span.className = "etiqueta-especial";
  span.textContent = texto;
  return span;
}

function limpiarEspecie() {
  pokeDescripcion.textContent = "Descripción no disponible.";
  pokeGeneracion.textContent = "—";
  pokeColor.textContent = "—";
  pokeHabitat.textContent = "—";
  pokeEtiquetasEspeciales.innerHTML = "";
}

// ============================================================
// MOSTRAR INFORMACIÓN PRINCIPAL DEL POKEMON
// ============================================================

function mostrarPokemon(datos) {
  pokeNombre.textContent = datos.name;
  pokeId.textContent = "#" + datos.id.toString().padStart(3, "0");

  actualizarImagenSegunModo();

  // Tipos (uno o dos, mismo estilo de badges de colores)
  pokeTipos.innerHTML = "";
  datos.types.forEach(function (t) {
    const badge = document.createElement("span");
    badge.className = "tipo-badge";
    badge.textContent = t.type.name;
    badge.style.background = COLORES_TIPO[t.type.name] || "#888";
    pokeTipos.appendChild(badge);
  });

  // El color del tipo principal se usa como "tema" de la tarjeta (borde, brillos, etc.)
  const tipoPrincipal = datos.types[0] ? datos.types[0].type.name : "normal";
  const colorTema = COLORES_TIPO[tipoPrincipal] || "#ff4d4d";
  cardScreen.style.setProperty("--color-tema", colorTema);
  cardScreen.style.setProperty("--color-tema-suave", colorTema + "aa");

  // Peso y altura (hectogramos -> kg, decímetros -> m)
  pokePeso.textContent = (datos.weight / 10) + " kg";
  pokeAltura.textContent = (datos.height / 10) + " m";

  // Experiencia base y orden (pueden no venir en algunos pokemon)
  pokeExperiencia.textContent = (datos.base_experience !== null && datos.base_experience !== undefined)
    ? datos.base_experience
    : "—";
  pokeOrden.textContent = (datos.order !== null && datos.order !== undefined)
    ? datos.order
    : "—";

  // Estadísticas base con barras animadas
  pokeStats.innerHTML = "";
  datos.stats.forEach(function (s) {
    const li = document.createElement("li");

    const nombreStat = document.createElement("span");
    nombreStat.className = "nombre-stat";
    nombreStat.textContent = s.stat.name;

    const barraFondo = document.createElement("div");
    barraFondo.className = "barra-fondo";

    const barra = document.createElement("div");
    barra.className = "barra";
    barraFondo.appendChild(barra);

    const valorStat = document.createElement("span");
    valorStat.className = "valor-stat";
    valorStat.textContent = s.base_stat;

    li.appendChild(nombreStat);
    li.appendChild(barraFondo);
    li.appendChild(valorStat);
    pokeStats.appendChild(li);

    // Se anima el ancho un instante después de insertarla en el DOM
    const porcentaje = Math.min((s.base_stat / 255) * 100, 100);
    setTimeout(function () {
      barra.style.width = porcentaje + "%";
    }, 50);
  });

  // Habilidades
  const listaHabilidades = datos.abilities.map(function (a) {
    return a.ability.name;
  });
  pokeHabilidades.textContent = listaHabilidades.join(", ");

  // Movimientos (solo una muestra, la lista completa suele ser enorme)
  const listaMovimientos = datos.moves.slice(0, 10).map(function (m) {
    return m.move.name;
  });
  pokeMovimientos.textContent = listaMovimientos.length > 0
    ? listaMovimientos.join(", ") + (datos.moves.length > 10 ? "..." : "")
    : "No hay movimientos registrados.";

  mostrarTab("general");
  mostrarCard();
}

// ============================================================
// SPRITE NORMAL / SHINY
// ============================================================

function actualizarImagenSegunModo() {
  if (!datosActuales) return;

  const sprites = datosActuales.sprites;
  const artworkOficial = sprites.other && sprites.other["official-artwork"];

  let urlImagen;

  if (mostrandoShiny) {
    urlImagen = (artworkOficial && artworkOficial.front_shiny)
      || sprites.front_shiny
      || sprites.front_default; // si no hay shiny, se usa el normal como respaldo
  } else {
    urlImagen = (artworkOficial && artworkOficial.front_default)
      || sprites.front_default;
  }

  // Pequeña transición: se oculta, se cambia el src, y vuelve a aparecer
  pokeImagen.style.opacity = "0";
  setTimeout(function () {
    pokeImagen.src = urlImagen || "";
    pokeImagen.alt = datosActuales.name + (mostrandoShiny ? " shiny" : "");
    pokeImagen.style.opacity = "1";
  }, 120);
}

function cambiarSprite(shiny) {
  mostrandoShiny = shiny;
  actualizarBotonesSprite();
  actualizarImagenSegunModo();

  if (shiny) {
    generarChispas();
  }
}

// Crea un pequeño estallido de chispas doradas alrededor de la imagen (solo efecto visual)
function generarChispas() {
  if (!chispasContenedor) return;

  chispasContenedor.innerHTML = "";
  const cantidad = 14;

  for (let i = 0; i < cantidad; i++) {
    const chispa = document.createElement("span");
    chispa.className = "chispa";

    const angulo = (Math.PI * 2 * i) / cantidad;
    const distancia = 60 + Math.random() * 30;
    const dx = Math.cos(angulo) * distancia;
    const dy = Math.sin(angulo) * distancia;

    chispa.style.setProperty("--dx", dx + "px");
    chispa.style.setProperty("--dy", dy + "px");
    chispa.style.left = "50%";
    chispa.style.top = "50%";

    chispasContenedor.appendChild(chispa);
  }

  // Se limpian después de que termina la animación para no acumular elementos
  setTimeout(function () {
    chispasContenedor.innerHTML = "";
  }, 1000);
}

function actualizarBotonesSprite() {
  btnNormal.classList.toggle("activo", !mostrandoShiny);
  btnShiny.classList.toggle("activo", mostrandoShiny);
}

btnNormal.addEventListener("click", function () {
  cambiarSprite(false);
});

btnShiny.addEventListener("click", function () {
  cambiarSprite(true);
});

// ============================================================
// NAVEGACIÓN ANTERIOR / SIGUIENTE (usando el ID actual)
// ============================================================

async function pokemonAnterior() {
  if (idActual === null || idActual <= 1) return;
  await cargarPokemonPorTermino(idActual - 1);
}

async function pokemonSiguiente() {
  if (idActual === null) return;
  await cargarPokemonPorTermino(idActual + 1);
}

btnAnterior.addEventListener("click", pokemonAnterior);
btnSiguiente.addEventListener("click", pokemonSiguiente);

// ============================================================
// MENÚ DE PESTAÑAS HORIZONTAL (General / Stats / Pokédex / Movimientos)
// ============================================================

function mostrarTab(nombreTab) {
  botonesTab.forEach(function (boton) {
    boton.classList.toggle("activo", boton.dataset.tab === nombreTab);
  });
  panelesTab.forEach(function (panel) {
    panel.classList.toggle("visible-panel", panel.id === "panel-" + nombreTab);
  });
  // Al cambiar de pestaña, la tarjeta vuelve a mostrarse desde arriba
  cardScreen.scrollTop = 0;
}

botonesTab.forEach(function (boton) {
  boton.addEventListener("click", function () {
    mostrarTab(boton.dataset.tab);
  });
});

// ============================================================
// MENSAJES Y VISIBILIDAD DE LA TARJETA
// ============================================================

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

function mostrarCard() {
  card.classList.add("visible");
}

function ocultarCard() {
  card.classList.remove("visible");
}

// ============================================================
// EVENTOS DEL BUSCADOR
// ============================================================

btnBuscar.addEventListener("click", buscarPokemon);

inputBusqueda.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    buscarPokemon();
  }
});
