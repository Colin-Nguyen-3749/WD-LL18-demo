// --- DOM elements ---
const randomBtn = document.getElementById("random-btn");
const recipeDisplay = document.getElementById("recipe-display");
const remixBtn = document.getElementById("remix-btn"); // The Remix button
const remixThemeSelect = document.getElementById("remix-theme"); // The theme dropdown
const remixOutput = document.getElementById("remix-output"); // Where the remix will be shown
const savedRecipesContainer = document.getElementById("saved-recipes-container"); // Container for saved recipes
const savedRecipesList = document.getElementById("saved-recipes-list"); // List of saved recipe names

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
    <button id="save-recipe-btn" onclick="saveCurrentRecipe()">Save Recipe</button>
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

// This function saves the current recipe name to local storage
function saveCurrentRecipe() {
  // Make sure we have a recipe to save
  if (!lastRecipe) {
    alert("No recipe to save!");
    return;
  }

  // Get the current saved recipes from local storage (or empty array if none)
  const savedRecipes = getSavedRecipes();
  
  // Check if this recipe is already saved
  const recipeName = lastRecipe.strMeal;
  if (savedRecipes.includes(recipeName)) {
    alert("This recipe is already saved!");
    return;
  }

  // Add the new recipe name to the list
  savedRecipes.push(recipeName);
  
  // Save the updated list back to local storage
  localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
  
  // Update the display to show the new saved recipe
  displaySavedRecipes();
  
  // Let the user know it was saved
  alert(`"${recipeName}" has been saved to your favorites!`);
}

// This function gets the saved recipe names from local storage
function getSavedRecipes() {
  // Get the saved recipes from local storage
  const saved = localStorage.getItem("savedRecipes");
  // If there are saved recipes, parse them from JSON, otherwise return empty array
  return saved ? JSON.parse(saved) : [];
}

// This function displays the list of saved recipe names on the page
function displaySavedRecipes() {
  // Get the saved recipes from local storage
  const savedRecipes = getSavedRecipes();
  
  // If there are no saved recipes, hide the container
  if (savedRecipes.length === 0) {
    savedRecipesContainer.style.display = "none";
    return;
  }
  
  // Show the container since we have saved recipes
  savedRecipesContainer.style.display = "block";
  
  // Create HTML for each saved recipe name with a clickable name and delete button
  let html = "";
  for (let i = 0; i < savedRecipes.length; i++) {
    const recipeName = savedRecipes[i];
    html += `
      <div class="saved-recipe-item">
        <span class="recipe-name clickable" onclick="loadSavedRecipe('${recipeName}')">${recipeName}</span>
        <button class="delete-btn" onclick="deleteRecipe('${recipeName}')">Delete</button>
      </div>
    `;
  }
  
  // Display the saved recipes list
  savedRecipesList.innerHTML = html;
}

// This function fetches a recipe by name from MealDB and displays it
async function loadSavedRecipe(recipeName) {
  // Show loading message while we fetch the recipe
  recipeDisplay.innerHTML = "<p>Loading your saved recipe...</p>";
  
  try {
    // Fetch the recipe by name from MealDB API
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${recipeName}`);
    const data = await response.json();
    
    // Check if we found the recipe
    if (data.meals && data.meals.length > 0) {
      // Get the first matching recipe and display it
      const recipe = data.meals[0];
      renderRecipe(recipe);
      // Clear any previous remix when loading a saved recipe
      remixOutput.innerHTML = "";
    } else {
      // Recipe not found in the API
      recipeDisplay.innerHTML = `<p>Sorry, we couldn't find the recipe "${recipeName}" in the database. It might have been removed.</p>`;
    }
    
  } catch (error) {
    // Show error message if something goes wrong
    recipeDisplay.innerHTML = `<p>Sorry, there was an error loading the recipe "${recipeName}". Please try again.</p>`;
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
  // Load and display any saved recipes from local storage
  displaySavedRecipes();
});
