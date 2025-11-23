document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear and rebuild activity select to avoid duplicated options on refresh
      activitySelect.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select an activity --";
      activitySelect.appendChild(placeholder);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic activity info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (added)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsTitle = document.createElement("strong");
        participantsTitle.textContent = "Participants:";
        participantsDiv.appendChild(participantsTitle);

        const ul = document.createElement("ul");

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-participant";
            deleteBtn.title = "Unregister participant";
            deleteBtn.innerHTML = "✖";

            // attach data for handler
            deleteBtn.dataset.activity = name;
            deleteBtn.dataset.email = p;

            // click handler to unregister participant
            deleteBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              const activityName = deleteBtn.dataset.activity;
              const email = deleteBtn.dataset.email;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                if (resp.ok) {
                  // refresh activities to reflect change
                  fetchActivities();
                } else {
                  const err = await resp.json().catch(() => ({}));
                  console.error("Failed to unregister:", err.detail || resp.statusText);
                  messageDiv.textContent = err.detail || "Failed to unregister participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                }
              } catch (error) {
                console.error("Error unregistering:", error);
                messageDiv.textContent = "Failed to unregister participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          li.className = "no-participants";
          ul.appendChild(li);
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh the activities list so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
