import React, { useState } from "react";
import searchRecipes from "./aiSearch";
import "./App.css";

function App() {

  // 🔐 AUTH
  const [isLogin, setIsLogin] = useState(true);

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  // 📦 STATES
  const [showForm, setShowForm] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // ✅ FILTER STATES
  const [showFilter, setShowFilter] = useState(false);

 

  // 🔐 LOGIN
  const handleLogin = async () => {

    const email =
      document.getElementById("loginEmail").value;

    const password =
      document.getElementById("loginPassword").value;

    try {

      const res = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await res.json();

      if (data.userId) {

        localStorage.setItem(
          "userId",
          data.userId
        );

        localStorage.setItem(
          "userName",
          data.userName
        );

        alert("Login successful ✅");

        window.location.reload();

      } else {

        alert(data.message);

      }

    } catch (err) {

      console.error(err);
      alert("Login error");

    }

  };

  // 📝 SIGNUP
  const handleSignup = async () => {

    const name =
      document.getElementById("signupName").value;

    const email =
      document.getElementById("signupEmail").value;

    const password =
      document.getElementById("signupPassword").value;

    try {

      await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      alert("Signup successful 🎉");

      setIsLogin(true);

    } catch (err) {

      console.error(err);
      alert("Signup error");

    }

  };

  // 🔍 SEARCH
  const handleSearch = async () => {

    try {

      const aiResults =
        searchRecipes(query);

      const response =
        await fetch(
          `http://localhost:5000/api/recipes/search/${query}`
        );

      const dbData =
        await response.json();

      const dbResults = dbData.map((r) => ({

  name: r.title,

  calories: "Custom",

  // ✅ split multiple keywords
  tags: r.keyword
    ? r.keyword.split(",").map(tag => tag.trim().toLowerCase())
    : [],

  ingredients: r.ingredients.split(","),

  steps: r.instructions.split("\n")

}));


      setResults([
        ...aiResults,
        ...dbResults
      ]);

    } catch (err) {

      console.error(err);

      alert(
        "Error fetching recipes"
      );

    }

  };

  // 🎤 VOICE
  const startVoice = () => {

    const recognition =
      new (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition
      )();

    recognition.lang = "en-IN";

    recognition.onresult =
      (event) => {

        const voiceText =
          event.results[0][0]
            .transcript;

        setQuery(voiceText);

        setTimeout(() => {

          handleSearch();

        }, 500);

      };

    recognition.start();

  };

  // ➕ ADD RECIPE
  const addRecipe = async () => {

    try {

      const response =
        await fetch(
          "http://localhost:5000/api/recipes/add",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

               

              title,
              keyword,
              ingredients,
              instructions

            })
          }
        );

      const data =
        await response.json();

      alert(data.message);

      setShowForm(false);

      setTitle("");
      setKeyword("");
      setIngredients("");
      setInstructions("");

    } catch (err) {

      console.error(err);

      alert(
        "Error adding recipe"
      );

    }

  };

  // ✅ CHECKBOX HANDLE
  const handleCheckboxChange = (value) => {

    if (
      selectedFilters.includes(value)
    ) {

      setSelectedFilters(
        selectedFilters.filter(
          (item) =>
            item !== value
        )
      );

    } else {

      setSelectedFilters([
        ...selectedFilters,
        value
      ]);

    }

  };

  // ✅ APPLY FILTER
  const applyFilter = async () => {

  try {

    // ✅ if no search text
    let allRecipes = [];

    if (query.trim() === "") {

      // fetch all DB recipes
      const response = await fetch(
        "http://localhost:5000/api/recipes/all"
      );

      const dbData = await response.json();

      const dbResults = dbData.map((r) => ({

        name: r.title,

        calories: "Custom",

        tags: r.keyword
          ? r.keyword.split(",").map(tag =>
              tag.trim().toLowerCase()
            )
          : [],

        ingredients: r.ingredients.split(","),

        steps: r.instructions.split(".")

      }));

      allRecipes = [
        ...searchRecipes(""),
        ...dbResults
      ];

    } else {

      allRecipes = results;

    }

    const filtered = allRecipes.filter(recipe =>

      selectedFilters.some(filter =>

        recipe.tags?.includes(
          filter.toLowerCase()
        )

      )

    );

    setResults(filtered);

    setShowFilter(false);

  } catch (err) {

    console.error(err);

    alert("Filter error");

  }

};
      

  // 🔓 LOGOUT
  const logout = () => {

    localStorage.clear();

    window.location.reload();

  };

  // 🔐 LOGIN SCREEN
  if (!userId) {

    return (

      <div className="auth-container">

        <h1>
          Rasoi.ai 🍲
        </h1>

        {isLogin ? (

          <>

            <h2>
              Login
            </h2>

            <input
              id="loginEmail"
              placeholder="Email"
            />

            <input
              id="loginPassword"
              type="password"
              placeholder="Password"
            />

            <button
              onClick={handleLogin}
            >
              Login
            </button>

            <p
              onClick={() =>
                setIsLogin(false)
              }
            >
              New user? Signup
            </p>

          </>

        ) : (

          <>

            <h2>
              Signup
            </h2>

            <input
              id="signupName"
              placeholder="Name"
            />

            <input
              id="signupEmail"
              placeholder="Email"
            />

            <input
              id="signupPassword"
              type="password"
              placeholder="Password"
            />

            <button
              onClick={handleSignup}
            >
              Signup
            </button>

            <p
              onClick={() =>
                setIsLogin(true)
              }
            >
              Already have account? Login
            </p>

          </>

        )}

      </div>

    );

  }

  // 🎯 MAIN UI
  return (

    <div className="app-viewport">

      <div className="overlay"></div>

      <div className="container">

        <header className="header">

          <h1 className="logo">
            Rasoi<span>.ai</span>
          </h1>

          <p>
            Hi {userName || "Chef"} 👋,
            what’s in your mind today?
          </p>

          <button onClick={logout}>
            Logout
          </button>

          <p className="subtitle">
            Modern Cooking Powered by Intelligence
          </p>

        </header>

        {/* SEARCH */}
        <div className="search-container">

          <div className="search-box">

            <input
              type="text"
              placeholder="Search recipes..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleSearch()
              }
            />

            <button
              className="voice-btn"
              onClick={startVoice}
            >
              🎤
            </button>

            <button
              className="search-btn"
              onClick={handleSearch}
            >
              Find Recipes
            </button>

            <button
              className="filter-open-btn"
              onClick={() =>
                setShowFilter(true)
              }
            >
              Filter
            </button>

            <button
              className="add-btn"
              onClick={() =>
                setShowForm(true)
              }
            >
              Add Recipe
            </button>

          </div>

        </div>

         {/* RECIPES */}
<div className="recipes-grid">

  {results.map((recipe, index) => (

    <div
      className={`recipe-card ${
        expandedIndex === index
          ? "expanded"
          : ""
      }`}
      key={index}
    >

      <div className="card-header">

        <h2>{recipe.name}</h2>

        <span className="calorie-badge">
          {recipe.calories} kcal
        </span>

      </div>

      <div className="tag-container">

        {recipe.tags?.map((tag, i) => (

          <span
            key={i}
            className="tag"
          >
            #{tag}
          </span>

        ))}

      </div>

      <div className="card-content">

        <section>

          <h3>Ingredients</h3>

          <ul>

            {recipe.ingredients.map((ing, i) => (

              <li key={i}>
                {ing}
              </li>

            ))}

          </ul>

        </section>

        <section>

          <h3>Instructions</h3>

          {expandedIndex === index ? (

            <ol>

              {recipe.steps.map((step, i) => (

                <li key={i}>
                  {step}
                </li>

              ))}

            </ol>

          ) : (

            <p>
              {recipe.steps[0]}...
            </p>

          )}

        </section>

      </div>

      <button
        onClick={() =>
          setExpandedIndex(
            expandedIndex === index
              ? null
              : index
          )
        }
      >

        {expandedIndex === index
          ? "Show Less"
          : "View Full Recipe"}

      </button>

    </div>

  ))}

</div>

        

        {/* FILTER POPUP */}
        {/* FILTER POPUP */}
{/* FILTER POPUP */}
{showFilter && (

  <div className="filter-popup">

    <h2>Select Filters</h2>

    {/* FIRST 5 FILTERS */}
    <label>
      <input
        type="checkbox"
        value="healthy"
        onChange={(e) =>
          handleCheckboxChange(e.target.value)
        }
      />
      healthy
    </label>

    <label>
      <input
        type="checkbox"
        value="protein"
        onChange={(e) =>
          handleCheckboxChange(e.target.value)
        }
      />
      protein
    </label>

    <label>
      <input
        type="checkbox"
        value="breakfast"
        onChange={(e) =>
          handleCheckboxChange(e.target.value)
        }
      />
      breakfast
    </label>

    <label>
      <input
        type="checkbox"
        value="easy"
        onChange={(e) =>
          handleCheckboxChange(e.target.value)
        }
      />
      easy
    </label>

    <label>
      <input
        type="checkbox"
        value="keto"
        onChange={(e) =>
          handleCheckboxChange(e.target.value)
        }
      />
      keto
    </label>

    {/* SHOW MORE BUTTON */}
    <button
      className="more-btn"
      onClick={() =>
        setShowMore(!showMore)
      }
    >
      {showMore ? "Show Less" : "More Filters"}
    </button>

    {/* EXTRA FILTERS */}
    {showMore && (
      <div className="extra-filters">

        <label>
          <input
            type="checkbox"
            value="vegetarian"
            onChange={(e) =>
              handleCheckboxChange(e.target.value)
            }
          />
          vegetarian
        </label>

        <label>
          <input
            type="checkbox"
            value="low carb"
            onChange={(e) =>
              handleCheckboxChange(e.target.value)
            }
          />
          low carb
        </label>

        <label>
          <input
            type="checkbox"
            value="vegan"
            onChange={(e) =>
              handleCheckboxChange(e.target.value)
            }
          />
          vegan
        </label>

        <label>
          <input
            type="checkbox"
            value="snacks"
            onChange={(e) =>
              handleCheckboxChange(e.target.value)
            }
          />
          snacks
        </label>

        <label>
          <input
            type="checkbox"
            value="weight loss"
            onChange={(e) =>
              handleCheckboxChange(e.target.value)
            }
          />
          weight loss
        </label>

        <label>
          <input
            type="checkbox"
            value="lunch"
            onChange={(e) =>
              handleCheckboxChange(e.target.value)
            }
          />
          lunch
        </label>

        <label>
          <input
            type="checkbox"
            value="fiber"
            onChange={(e) =>
              handleCheckboxChange(e.target.value)
            }
          />
          fiber
        </label>

      </div>
    )}

    {/* APPLY BUTTON */}
    <button
      className="apply-btn"
      onClick={applyFilter}
    >
      Apply
    </button>

    {/* CANCEL */}
    <button
      className="cancel-btn"
      onClick={() =>
        setShowFilter(false)
      }
    >
      Cancel
    </button>

  </div>

)}
        
        {/* ADD FORM */}
        {showForm && (

          <div className="add-recipe-form">

            <h2>
              Add Recipe
            </h2>

            <input
              placeholder="Title"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
            />

            <input
              placeholder="Keyword"
              value={keyword}
              onChange={(e) =>
                setKeyword(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Ingredients"
              value={ingredients}
              onChange={(e) =>
                setIngredients(
                  e.target.value
                )
              }
            />

            <textarea
              placeholder="Instructions"
              value={instructions}
              onChange={(e) =>
                setInstructions(
                  e.target.value
                )
              }
            />

            <button
              onClick={addRecipe}
            >
              Submit
            </button>

            <button
              onClick={() =>
                setShowForm(false)
              }
            >
              Cancel
            </button>

          </div>

        )}

      </div>

    </div>

  );

}

export default App;