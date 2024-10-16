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
                <span>${STATE[column][row].computedValue}</span>
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

	cell.computedValue = computeValue(value, constants); // -> span
	cell.value = value; // -> input

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
	console.log("computeAllCells");
	cells.forEach((rows, x) => {
		rows.forEach((cell, y) => {
			const computedValue = computeValue(cell.value, constants);
			cell.computedValue = computedValue;
		});
	});
}

/* Event Listeners */
$tableBody.addEventListener("click", (e) => {
	console.log(e.target);
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

renderSpreadSheet();
