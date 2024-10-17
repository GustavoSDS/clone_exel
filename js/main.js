const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const $table = $("table");
const $tableHead = $("thead");
const $tableBody = $("tbody");

const ROWS = 10;
const COLUMNS = 6;
const FIRST_CHAR_CODE = 65;

const range = (length) => Array.from({ length }, (_, i) => i);
const getColumn = (column) => String.fromCharCode(FIRST_CHAR_CODE + column);

let STATE = range(COLUMNS).map((i) =>
	range(ROWS).map((j) => ({ computedValue: 0, value: 0 }))
);
let selectedColumn = null;

/* Functions */
function renderSpreadSheet() {
	const headerHTML = `<tr>
    <th>&nbsp;</th>
    ${range(COLUMNS)
			.map((i) => `<th>${getColumn(i)}</th>`)
			.join("")}
    </tr>`;
	$tableHead.innerHTML = headerHTML;

	const bodyHTML = range(ROWS)
		.map(
			(row) => `<tr>
        <td>${row + 1}</td>
        ${range(COLUMNS)
					.map(
						(column) =>
							`
             <td data-x="${column}" data-y="${row}">
                <span>${
									STATE[column][row].computedValue === 0
										? STATE[column][row].value === "0" ? "" : ""
										: STATE[column][row].computedValue
								}</span>
                <input type="text" value="${STATE[column][row].value}" />
             </td>
            `
					)
					.join("")}
    </tr>`
		)
		.join("");
	$tableBody.innerHTML = bodyHTML;
}

function updateCell({ x, y, value }) {
	const newState = structuredClone(STATE);
	const constants = generateCellsConstants(newState);

	const cell = newState[x][y];

	cell.computedValue = computeValue(value, constants);
	cell.value = value;

	newState[x][y] = cell;

	computeAllCells(newState, generateCellsConstants(newState));

	STATE = newState;

	renderSpreadSheet();
}

function computeValue(value, constants) {
	if (typeof value === "number") return value;
	if (!value.startsWith("=")) return value;

	const formula = value.slice(1);
	let computedValue;
	try {
		// TODO: MEJORAR ESTO, CON UNA LIBRERÍA DE CALCULO
		computedValue = eval(`
            (()=>{
                ${constants}
                return ${formula};
                })()`);
	} catch (error) {
		computedValue = `Hubo un error: ${error.message}`;
	}
	return computedValue;
}

function generateCellsConstants(cells) {
	return cells
		.map((rows, x) => {
			return rows
				.map((cell, y) => {
					const letter = getColumn(x);
					const cellId = `${letter}${y + 1}`;
					if (cell.computedValue)
						return `const ${cellId} = ${cell.computedValue};`;
				})
				.join("\n");
		})
		.join("\n");
}

// TODO: OBSERVAR O SUSCRIBIRSE A LAS CELDAS QUE ME INTERESAN SUS VALORES
function computeAllCells(cells, constants) {
	cells.forEach((rows, x) => {
		rows.forEach((cell, y) => {
			const computedValue = computeValue(cell.value, constants);
			cell.computedValue = computedValue;
		});
	});
}

/* Event Listeners */
$tableBody.addEventListener("click", (e) => {
	const td = e.target.closest("td");
	if (!td) return;

	const { x, y } = td.dataset;
	const $input = td.querySelector("input");
	const $span = td.querySelector("span");

	$input.focus();
	$input.select();
	$input.setSelectionRange(0, $input.value.length);
	$span.innerHTML = STATE[x][y].computedValue;

	$input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") $input.blur();
	});
	$input.addEventListener(
		"blur",
		() => {
			if ($input.value === STATE[x][y].value) return;
			updateCell({ x, y, value: $input.value });
		},
		{ once: true }
	);
});

$tableHead.addEventListener("click", (e) => {
	const th = e.target.closest("th");
	if (!th) return;

    const x = [...th.parentNode.children].indexOf(th);
    if(x<=0) return;

    selectedColumn = x - 1;
    th.classList.toggle("selected");
    $$(`tr td:nth-child(${x+1})`).forEach(td => td.classList.toggle("selected"));
});

document.addEventListener("keydown", (e) => {
	if(e.key === "Backspace" && selectedColumn!==null){
        range(ROWS).forEach(row => {
            updateCell({ x: selectedColumn, y: row, value: 0 });
        });
        renderSpreadSheet();
    }
})

document.addEventListener("copy", (event) => {
    console.log("copiando");
    if(selectedColumn!==null){
        const columnValues = range(ROWS).map(row => STATE[selectedColumn][row].value);
        event.clipboardData.setData("text/plain", columnValues.join("\n"));
        event.preventDefault();
    }
});

document.addEventListener("click", (event) => {
    const {target} = event;

    const isThClicked = target.matches("th");
    const isTdClicked = target.matches("td");
    if(!isThClicked && !isTdClicked) {
        $$(".selected").forEach(td => td.classList.remove("selected"));
        selectedColumn = null;
        return;
    }

    
});

renderSpreadSheet();


/* 
TODO: HACER OPERACIONES POR RANGOS: A1:A10, A1:B10, A1:C10 DETECTANDO CUANDO SE QUIERE HACER UNA OPERACION POR RANGOS Y HACER UN FOREACH

TODO: AÑADIR COPY DE LAS FILAS
 */