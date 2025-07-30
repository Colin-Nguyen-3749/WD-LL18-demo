// --- DOM elements ---
const randomBtn = document.getElementById("random-btn");
const recipeDisplay = document.getElementById("recipe-display");
const remixBtn = document.getElementById("remix-btn"); // The Remix button
const remixThemeSelect = document.getElementById("remix-theme"); // The theme dropdown
const remixOutput = document.getElementById("remix-output"); // Where the remix will be shown

// Store the last displayed recipe so we can remix it
let lastRecipe = null;

// This function creates a list of ingredients for the recipe from the API data
// It loops through the ingredients and measures, up to 20, and returns an HTML string
// that can be used to display them in a list format
// If an ingredient is empty or just whitespace, it skips that item 
function getIngredientsHtml(recipe) {
  let html = "";
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const meas = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) {
      html += `<li>${meas ? `${meas} ` : ""}${ing}</li>`;
    }
  }
  return html;
}

// This function displays the recipe on the page
function renderRecipe(recipe) {
  recipeDisplay.innerHTML = `
    <div class="recipe-title-row">
      <h2>${recipe.strMeal}</h2>
    </div>
    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" />
    <h3>Ingredients:</h3>
    <ul>${getIngredientsHtml(recipe)}</ul>
    <h3>Instructions:</h3>
    <p>${recipe.strInstructions.replace(/\r?\n/g, "<br>")}</p>
  `;
  // Save the recipe so we can remix it
  lastRecipe = recipe;
}

// This function gets a random recipe from the API and shows it
async function fetchAndDisplayRandomRecipe() {
  recipeDisplay.innerHTML = "<p>Loading...</p>"; // Show loading message
  try {
    // Fetch a random recipe from the MealDB API
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php'); // Replace with the actual API URL
    console.log(res);
    const data = await res.json(); // Parse the JSON response
    console.log(data);
    const recipe = data.meals[0]; // Get the first recipe from the response
    renderRecipe(recipe);
    remixOutput.innerHTML = ""; // Clear previous remix when new recipe loads
  } catch (error) {
    recipeDisplay.innerHTML = "<p>Sorry, couldn't load a recipe.</p>";
  }
}

// This function sends the recipe and theme to OpenAI and displays the remix
async function remixRecipe(recipe, theme) {
  // Show a loading message while waiting for AI
  remixOutput.innerHTML = "<p>Remixing your recipe... Hang tight, chef! 🧑‍🍳✨</p>";
  try {
    // Prepare the prompt for the AI
    const prompt = `Remix this recipe for the theme: ${theme}.\n\nRecipe JSON:\n${JSON.stringify(recipe, null, 2)}\n\nPlease reply with a short, fun, creative, and doable remix. Highlight any changed ingredients or instructions.`;

    // Send the request to OpenAI's chat completions API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.9
      })
    });

    // Parse the response
    const result = await response.json();
    // Get the AI's reply
    const aiReply = result.choices && result.choices[0] && result.choices[0].message.content;
    if (aiReply) {
      remixOutput.innerHTML = `<p>${aiReply.replace(/\n/g, "<br>")}</p>`;
    } else {
      remixOutput.innerHTML = "<p>Sorry, the AI couldn't remix your recipe this time.</p>";
    }
  } catch (err) {
    remixOutput.innerHTML = "<p>Oops! Something went wrong while remixing. Please try again later.</p>";
  }
}


// --- Event listeners ---

// When the button is clicked, get and show a new random recipe
randomBtn.addEventListener("click", () => {
  fetchAndDisplayRandomRecipe();
});

// When the Remix button is clicked, send the recipe and theme to OpenAI
remixBtn.addEventListener("click", () => {
  if (lastRecipe) {
    const theme = remixThemeSelect.value;
    remixRecipe(lastRecipe, theme);
  } else {
    remixOutput.innerHTML = "<p>Load a recipe first before remixing!</p>";
  }
});

// When the page loads, show a random recipe right away
document.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayRandomRecipe();
});
