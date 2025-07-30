// --- DOM elements ---
const randomBtn = document.getElementById("random-btn");
const recipeDisplay = document.getElementById("recipe-display");
const remixBtn = document.getElementById("remix-btn");
const remixThemeSelect = document.getElementById("remix-theme");
const remixDisplay = document.getElementById("remix-display");

// Store the current recipe data so we can remix it later
let currentRecipe = null;

// This function creates a list of ingredients for the recipe from the API data
// It loops through the ingredients and measures, up to 20, and returns an HTML string
// that can be used to display them in a list format
// If an ingredient is empty or just whitespace, it skips that item 
function getIngredientsHtml(recipe) {
  let html = "";
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const meas = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) html += `<li>${meas ? `${meas} ` : ""}${ing}</li>`;
  }
  return html;
}

// This function displays the recipe on the page
function renderRecipe(recipe) {
  // Save the current recipe so we can remix it
  currentRecipe = recipe;
  
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
}

// This function gets a random recipe from the API and shows it
async function fetchAndDisplayRandomRecipe() {
  recipeDisplay.innerHTML = "<p>Loading...</p>"; // Show loading message
  try {
    // Fetch a random recipe from the MealDB API
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php'); // Replace with the actual API URL
    
    const data = await res.json(); // Parse the JSON response
    const recipe = data.meals[0]; // Get the first recipe from the response
    renderRecipe(recipe);

  } catch (error) {
    recipeDisplay.innerHTML = "<p>Sorry, couldn't load a recipe.</p>";
  }
}


// This helper function converts ingredients to plain text for sending to OpenAI
function getIngredientsText(recipe) {
  let ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const meas = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredients.push(`${meas ? `${meas} ` : ""}${ing}`);
    }
  }
  return ingredients.join(', ');
}

// This function takes the current recipe and remix theme, sends them to OpenAI,
// and displays the remixed recipe on the page
async function remixRecipe() {
  // Make sure we have a recipe to remix
  if (!currentRecipe) {
    alert("Please load a recipe first!");
    return;
  }

  // Get the theme the user selected
  const remixTheme = remixThemeSelect.value;
  
  // Show a fun loading message while we wait for OpenAI
  remixDisplay.innerHTML = "<p>🍳 Cooking up your remix... This might take a moment!</p>";

  try {
    // Prepare the recipe data to send to OpenAI
    const recipeText = `
Recipe: ${currentRecipe.strMeal}
Ingredients: ${getIngredientsText(currentRecipe)}
Instructions: ${currentRecipe.strInstructions}
    `.trim();

    // Send the recipe and theme to OpenAI's chat completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'user',
            content: `Please remix this recipe with a ${remixTheme} theme. Make it short, fun, creative, and totally doable. Highlight any changed ingredients or cooking instructions:\n\n${recipeText}`
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      })
    });

    // Get the response data from OpenAI
    const data = await response.json();
    
    // Check if we got a good response
    if (data.choices && data.choices[0]) {
      // Display the remixed recipe on the page
      const remixedRecipe = data.choices[0].message.content;
      remixDisplay.innerHTML = `
        <h3>🎉 Your ${remixTheme} Remix:</h3>
        <div class="remix-content">${remixedRecipe.replace(/\n/g, '<br>')}</div>
      `;
    } else {
      throw new Error('No response from AI');
    }

  } catch (error) {
    // Show a friendly error message if something goes wrong
    remixDisplay.innerHTML = `
      <p>😅 Oops! Something went wrong while creating your remix. Please try again!</p>
    `;
  }
}

// --- Event listeners ---

// When the button is clicked, get and show a new random recipe
randomBtn.addEventListener("click", () => {
  fetchAndDisplayRandomRecipe();
});

// When the remix button is clicked, remix the current recipe
remixBtn.addEventListener("click", () => {
  remixRecipe();
});

// When the page loads, show a random recipe right away
document.addEventListener("DOMContentLoaded", () =>{
  fetchAndDisplayRandomRecipe();
});