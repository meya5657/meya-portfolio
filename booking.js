// Meeting booking: calendar date picker + time slots, sent by email through FormSubmit.
(function () {
  const root = document.getElementById("booking");
  if (!root) return;

  const ENDPOINT = "https://formsubmit.co/ajax/meyaajohnson@gmail.com";
  const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const monthLabel = document.getElementById("calMonth");
  const daysGrid = document.getElementById("calDays");
  const prevBtn = document.getElementById("calPrev");
  const nextBtn = document.getElementById("calNext");
  const slotsWrap = document.getElementById("timeSlots");
  const slotsHint = document.getElementById("slotsHint");
  const summary = document.getElementById("bookingSummary");
  const form = document.getElementById("bookingForm");
  const status = document.getElementById("bookingStatus");
  const submitBtn = document.getElementById("bookingSubmit");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = null;
  let selectedTime = null;

  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const formatDate = (d) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  function renderCalendar() {
    monthLabel.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
    prevBtn.disabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    daysGrid.innerHTML = "";

    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < firstWeekday; i++) daysGrid.appendChild(document.createElement("span"));

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = day;
      btn.setAttribute("aria-label", formatDate(date));
      btn.className = "cal-day h-10 rounded font-semibold transition";
      const isPast = date < today;
      if (isPast) {
        btn.disabled = true;
        btn.classList.add("text-[#b5b5b5]", "cursor-not-allowed");
      } else {
        btn.classList.add("text-[#262626]", "hover:bg-white/80");
        btn.addEventListener("click", () => {
          selectedDate = date;
          selectedTime = null;
          renderCalendar();
          renderSlots();
          updateSummary();
        });
      }
      if (sameDay(date, today)) btn.classList.add("ring-1", "ring-[#595959]/40");
      if (sameDay(date, selectedDate)) {
        btn.classList.remove("text-[#262626]", "hover:bg-white/80");
        btn.classList.add("bg-[#370748]", "text-white");
        btn.setAttribute("aria-pressed", "true");
      }
      daysGrid.appendChild(btn);
    }
  }

  function renderSlots() {
    slotsWrap.innerHTML = "";
    if (!selectedDate) {
      slotsHint.textContent = "Pick a date to see times.";
      return;
    }
    slotsHint.textContent = `Times for ${formatDate(selectedDate)} (Eastern Time)`;
    TIME_SLOTS.forEach((time) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = time;
      const active = time === selectedTime;
      btn.className = `rounded border px-3 py-2 text-sm font-bold transition ${active ? "border-[#370748] bg-[#370748] text-white" : "border-[#595959]/40 bg-white/55 text-[#595959] hover:bg-white"}`;
      btn.setAttribute("aria-pressed", String(active));
      btn.addEventListener("click", () => {
        selectedTime = time;
        renderSlots();
        updateSummary();
      });
      slotsWrap.appendChild(btn);
    });
  }

  function updateSummary() {
    if (selectedDate && selectedTime) {
      summary.innerHTML = `<i class="fa-solid fa-calendar-check mr-2" aria-hidden="true"></i>${formatDate(selectedDate)} at ${selectedTime} ET`;
      summary.classList.remove("text-[#7f7f7f]");
      summary.classList.add("text-[#262626]");
    } else {
      summary.textContent = "No date and time selected yet.";
      summary.classList.add("text-[#7f7f7f]");
      summary.classList.remove("text-[#262626]");
    }
  }

  function showStatus(message, isError) {
    status.textContent = message;
    status.classList.remove("hidden");
    status.classList.toggle("text-red-700", isError);
  }

  prevBtn.addEventListener("click", () => {
    viewMonth -= 1;
    if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
    renderCalendar();
  });
  nextBtn.addEventListener("click", () => {
    viewMonth += 1;
    if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
    renderCalendar();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedDate || !selectedTime) {
      showStatus("Please pick a date and a time on the calendar first.", true);
      return;
    }
    const name = form.elements.bookName;
    const email = form.elements.bookEmail;
    if (!name.checkValidity() || !email.checkValidity()) {
      showStatus("Please enter your name and a valid email address.", true);
      (name.checkValidity() ? email : name).focus();
      return;
    }

    const when = `${formatDate(selectedDate)} at ${selectedTime} (Eastern Time)`;
    const payload = {
      _subject: `New meeting request: ${name.value.trim()} - ${when}`,
      _template: "table",
      _captcha: "false",
      _replyto: email.value.trim(),
      "Requested time": when,
      "Meeting type": form.elements.bookType.value,
      Name: name.value.trim(),
      Email: email.value.trim(),
      Phone: form.elements.bookPhone.value.trim() || "Not provided",
      Note: form.elements.bookNote.value.trim() || "No note",
      _honey: form.elements._honey.value,
    };

    submitBtn.disabled = true;
    showStatus("Sending your request...", false);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === "false" || data.success === false) throw new Error(data.message || "Request failed");
      showStatus(`Thanks, ${name.value.trim().split(" ")[0]}! Your request for ${when} was sent. Meya will email you to confirm.`, false);
      form.reset();
      selectedDate = null;
      selectedTime = null;
      renderCalendar();
      renderSlots();
      updateSummary();
    } catch (err) {
      showStatus("Sorry, the request didn't go through. Please try again, or email meyaajohnson@gmail.com directly.", true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  renderCalendar();
  renderSlots();
  updateSummary();
})();
