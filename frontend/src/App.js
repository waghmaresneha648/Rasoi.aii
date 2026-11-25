
import React, { useState } from "react";
import Chatbot from "./components/Chatbot";
import searchRecipes from "./aiSearch";
import "./App.css";

function App() {
  // Authentication
  const [isLogin, setIsLogin] = useState(true);

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  // UI states
  const [showForm, setShowForm] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);

  // Recipe form states
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  // Search states
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Login
  const handleLogin = async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.userId) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.userName);

        alert("Login successful!");
        window.location.reload();
      } else {
        alert(data.message || "Invalid login details");
      }
    } catch (err) {
      console.error(err);
      alert("Login error. Please try again.");
    }
  };

  // Signup
  const handleSignup = async () => {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Signup failed");
        return;
      }

      alert("Signup successful! Please log in.");
      setIsLogin(true);
    } catch (err) {
      console.error(err);
      alert("Signup error. Please try again.");
    }
  };

  // Recipe search
  const handleSearch = async (searchText = query) => {
    const searchTerm = searchText.trim();

    try {
      const aiResults = searchRecipes(searchTerm);

      const response = await fetch(
        `http://localhost:5000/api/recipes/search/${encodeURIComponent(searchTerm)}`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch recipes");
      }

      const dbData = await response.json();

      const dbResults = dbData.map((recipe) => ({
        name: recipe.title,
        calories: "Custom",
        tags: recipe.keyword
          ? recipe.keyword.split(",").map((tag) => tag.trim().toLowerCase())
          : [],
        ingredients: recipe.ingredients
          ? recipe.ingredients.split(",")
          : [],
        steps: recipe.instructions
          ? recipe.instructions.split("\n")
          : []
      }));

      setResults([...aiResults, ...dbResults]);
      setExpandedIndex(null);
    } catch (err) {
      console.error(err);
      alert("Error fetching recipes. Please try again.");
    }
  };

  // Voice search
  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setQuery(voiceText);
      handleSearch(voiceText);
    };

    recognition.onerror = (event) => {
      console.error("Voice search error:", event.error);
      alert("Could not recognize your voice. Please try again.");
    };

    recognition.start();
  };

  // Add recipe
  const addRecipe = async () => {
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      alert("Please fill in the recipe title, ingredients and instructions.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/recipes/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          keyword,
          ingredients,
          instructions
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not add recipe.");
        return;
      }

      alert(data.message || "Recipe added successfully!");

      setShowForm(false);
      setTitle("");
      setKeyword("");
      setIngredients("");
      setInstructions("");
    } catch (err) {
      console.error(err);
      alert("Error adding recipe. Please try again.");
    }
  };

  // Filter selection
  const handleCheckboxChange = (value) => {
    setSelectedFilters((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  // Apply filters
  const applyFilter = async () => {
    try {
      let allRecipes = [];

      if (query.trim() === "") {
        const response = await fetch(
          "http://localhost:5000/api/recipes/all"
        );

        if (!response.ok) {
          throw new Error("Unable to fetch recipes");
        }

        const dbData = await response.json();

        const dbResults = dbData.map((recipe) => ({
          name: recipe.title,
          calories: "Custom",
          tags: recipe.keyword
            ? recipe.keyword.split(",").map((tag) => tag.trim().toLowerCase())
            : [],
          ingredients: recipe.ingredients
            ? recipe.ingredients.split(",")
            : [],
          steps: recipe.instructions
            ? recipe.instructions.split(".")
            : []
        }));

        allRecipes = [...searchRecipes(""), ...dbResults];
      } else {
        allRecipes = results;
      }

      const filtered = allRecipes.filter((recipe) =>
        selectedFilters.some((filter) =>
          recipe.tags?.includes(filter.toLowerCase())
        )
      );

      setResults(filtered);
      setExpandedIndex(null);
      setShowFilter(false);
    } catch (err) {
      console.error(err);
      alert("Filter error. Please try again.");
    }
  };

  // Logout
  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Login and signup screen
  if (!userId) {
    return (
      <div className="auth-container">
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="brand-mark">N.</div>

            <h1 className="brand-name">
              NutriWise<span>.ai</span>
            </h1>

            <p className="auth-tagline">
              Eat well. Feel well. Live beautifully.
            </p>

            <div className="auth-food-decoration">
              <span>Fresh ingredients</span>
              <span>Thoughtful recipes</span>
              <span>Better everyday choices</span>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <p className="eyebrow">WELCOME TO NUTRIWISE</p>

            <h2>
              {isLogin ? "Welcome back." : "Create your account."}
            </h2>

            <p className="auth-description">
              {isLogin
                ? "Sign in to discover recipes and make every meal count."
                : "Join us and start discovering a better way to eat."}
            </p>

            {isLogin ? (
              <div className="auth-fields">
                <label htmlFor="loginEmail">Email address</label>
                <input
                  id="loginEmail"
                  type="email"
                  placeholder="Enter your email"
                />

                <label htmlFor="loginPassword">Password</label>
                <input
                  id="loginPassword"
                  type="password"
                  placeholder="Enter your password"
                />

                <button className="auth-submit-btn" onClick={handleLogin}>
                  Sign In
                </button>

                <p className="auth-switch">
                  Don't have an account?{" "}
                  <span onClick={() => setIsLogin(false)}>Sign up</span>
                </p>
              </div>
            ) : (
              <div className="auth-fields">
                <label htmlFor="signupName">Full name</label>
                <input
                  id="signupName"
                  type="text"
                  placeholder="Enter your name"
                />

                <label htmlFor="signupEmail">Email address</label>
                <input
                  id="signupEmail"
                  type="email"
                  placeholder="Enter your email"
                />

                <label htmlFor="signupPassword">Password</label>
                <input
                  id="signupPassword"
                  type="password"
                  placeholder="Create a password"
                />

                <button className="auth-submit-btn" onClick={handleSignup}>
                  Create Account
                </button>

                <p className="auth-switch">
                  Already have an account?{" "}
                  <span onClick={() => setIsLogin(true)}>Sign in</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main application
  return (
    <div className="app-viewport">
      <div className="app-container">

        {/* Navigation */}
        <header className="main-navbar">
          <a href="/" className="logo">
            NutriWise<span>.ai</span>
          </a>

          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#discover">Discover</a>
            <a href="#about">About</a>
          </nav>

          <div className="nav-user">
            <span className="nav-greeting">
              Hi, {userName || "Chef"}
            </span>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* Hero section */}
        <section className="hero-section" id="home">
          <div className="hero-content">
            <p className="eyebrow">A LITTLE MORE GOODNESS, EVERY DAY</p>

            <h1>
              Make every meal
              <br />
              <span>feel a little better.</span>
            </h1>

            <p className="hero-description">
              Discover nourishing recipes, explore ingredients and find
              inspiration for your everyday cooking.
            </p>

            <button
              className="hero-cta"
              onClick={() =>
                document.getElementById("recipe-search")?.scrollIntoView({
                  behavior: "smooth"
                })
              }
            >
              Explore Recipes
            </button>
          </div>

          <div className="hero-image-area">
            <div className="hero-image-placeholder">
              <span>Fresh food. Simple choices.</span>
            </div>
          </div>
        </section>
        {/* Why NutriWise */}
<section className="why-nutriwise">
  <p className="eyebrow">A BETTER WAY TO EAT</p>
  <h2>Good food. Simple choices.</h2>
  <p className="why-description">
    Eating well doesn't have to be complicated. Find ideas and inspiration
    to make everyday meals more enjoyable.
  </p>

  <div className="why-grid">
    <div className="why-item">
      <h3>Discover</h3>
      <p>Find recipes that match your taste and ingredients.</p>
    </div>

    <div className="why-item">
      <h3>Eat Mindfully</h3>
      <p>Explore simple ways to make thoughtful food choices.</p>
    </div>

    <div className="why-item">
      <h3>Share</h3>
      <p>Bring your own recipes and cooking ideas to the community.</p>
    </div>
  </div>
</section>
        {/* Recipe discovery */}
        <section className="discover-section" id="discover">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIND YOUR NEXT FAVOURITE</p>
              <h2>What are you craving today?</h2>
              <p>
                Search recipes from our collection and discover something
                delicious.
              </p>
            </div>
          </div>

          <div className="search-container" id="recipe-search">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search recipes, ingredients or meals..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSearch()
                }
              />

              
<button
  className="voice-btn"
  onClick={startVoice}
  title="Voice search"
  aria-label="Voice search"
>
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
    <path d="M12 19v3" />
    <path d="M8 22h8" />
  </svg>
</button>


              <button className="search-btn" onClick={() => handleSearch()}>
                Search
              </button>

              <button
                className="filter-open-btn"
                onClick={() => setShowFilter(true)}
              >
                Filters
              </button>

              <button
                className="add-btn"
                onClick={() => setShowForm(true)}
              >
                + Add Recipe
              </button>
            </div>
          </div>

          {/* Recipe cards */}
          <div className="recipes-grid">
            {results.length > 0 ? (
              results.map((recipe, index) => (
                <article
                  className={`recipe-card ${
                    expandedIndex === index ? "expanded" : ""
                  }`}
                  key={`${recipe.name}-${index}`}
                >
                  <div className="recipe-card-image">
                    <span>NutriWise Recipe</span>
                  </div>

                  <div className="recipe-card-body">
                    <div className="card-header">
                      <h3>{recipe.name}</h3>
                      <span className="calorie-badge">
                        {recipe.calories}
                      </span>
                    </div>

                    <div className="tag-container">
                      {recipe.tags?.map((tag, i) => (
                        <span className="tag" key={i}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <section className="recipe-details">
                      <h4>Ingredients</h4>
                      <ul>
                        {recipe.ingredients?.map((ingredient, i) => (
                          <li key={i}>{ingredient}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="recipe-details">
                      <h4>Instructions</h4>

                      {expandedIndex === index ? (
                        <ol>
                          {recipe.steps?.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <p>
                          {recipe.steps?.[0] || "View this recipe for details."}
                          {recipe.steps?.length > 1 ? "..." : ""}
                        </p>
                      )}
                    </section>

                    <button
                      className="view-recipe-btn"
                      onClick={() =>
                        setExpandedIndex(
                          expandedIndex === index ? null : index
                        )
                      }
                    >
                      {expandedIndex === index
                        ? "Show Less"
                        : "View Full Recipe"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-recipes">
                <span className="empty-icon">✳</span>
                <h3>Your next favourite meal is waiting.</h3>
                <p>
                  Search for a recipe or ingredient to get started.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Filter popup */}
        {showFilter && (
          <div className="modal-backdrop">
            <div className="filter-popup">
              <div className="modal-heading">
                <div>
                  <p className="eyebrow">PERSONALISE YOUR SEARCH</p>
                  <h2>Explore by preference</h2>
                </div>
                <button
                  className="modal-close"
                  onClick={() => setShowFilter(false)}
                >
                  ×
                </button>
              </div>

              <div className="filter-options">
                {[
                  "healthy",
                  "protein",
                  "breakfast",
                  "easy",
                  "keto"
                ].map((filter) => (
                  <label key={filter}>
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter)}
                      onChange={() => handleCheckboxChange(filter)}
                    />
                    {filter}
                  </label>
                ))}
              </div>

              <button
                className="more-btn"
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? "Show Less" : "More Filters"}
              </button>

              {showMore && (
                <div className="filter-options extra-filters">
                  {[
                    "vegetarian",
                    "low carb",
                    "vegan",
                    "snacks",
                    "weight loss",
                    "lunch",
                    "fiber"
                  ].map((filter) => (
                    <label key={filter}>
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(filter)}
                        onChange={() => handleCheckboxChange(filter)}
                      />
                      {filter}
                    </label>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button className="apply-btn" onClick={applyFilter}>
                  Apply Filters
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => setShowFilter(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add recipe form */}
        {showForm && (
          <div className="modal-backdrop">
            <div className="add-recipe-form">
              <div className="modal-heading">
                <div>
                  <p className="eyebrow">SHARE SOMETHING DELICIOUS</p>
                  <h2>Add your recipe</h2>
                </div>

                <button
                  className="modal-close"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>
              </div>

              <label>Recipe title</label>
              <input
                placeholder="e.g. Homemade vegetable soup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <label>Keywords</label>
              <input
                placeholder="e.g. healthy, lunch, vegetarian"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />

              <label>Ingredients</label>
              <textarea
                placeholder="Add ingredients separated by commas..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
              />

              <label>Instructions</label>
              <textarea
                placeholder="Write the recipe steps..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />

              <div className="modal-actions">
                <button className="apply-btn" onClick={addRecipe}>
                  Submit Recipe
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* About */}
        {/* About section */}
<section className="about-section" id="about">
  <p className="eyebrow">GET TO KNOW US</p>
  <h2>About NutriWise</h2>

  <p className="about-intro">
    NutriWise makes discovering and sharing everyday food inspiration
    simple, enjoyable and accessible.
  </p>

  <div className="about-content">
    <div>
      <h3>Our Mission</h3>
      <p>
        We believe better food choices begin with simple ideas.
        Our goal is to make everyday cooking a little easier and healthier.
      </p>
    </div>

    <div>
      <h3>What We Offer</h3>
      <p>
        Discover recipes, search by ingredients, explore food suggestions
        and share your own creations with others.
      </p>
    </div>
  </div>
</section>

<footer className="app-footer">
  <a href="/" className="logo">
    NutriWise<span>.ai</span>
  </a>

  <p>Eat well. Feel well. Live beautifully.</p>
  <span>Made for better everyday choices.</span>
</footer>
      </div>

      <Chatbot />
    </div>
  );
}

export default App;
