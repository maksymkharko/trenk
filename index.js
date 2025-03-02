function Atom(initValue) {
  let value = initValue;
  const watchers = [];
  return {
    val: () => value,
    update: (f) => {
      const oldValue = value;
      const newValue = f(value);
      if (oldValue !== newValue) {
        value = newValue;
        watchers.forEach((watcher) => watcher(newValue));
      }
    },
    set: (val) => {
      const oldValue = value;
      if (val !== oldValue) {
        value = val;
        watchers.forEach((watcher) => watcher(val));
      }
    },
    addWatcher: (watcher) => watchers.push(watcher),
    removeWatcher: (watcher) => {
      watchers.splice(watchers.indexOf(watcher), 1);
    },
  };
}

const subs = (atom, field, fn) => {
  let previousFieldValue;

  atom.addWatcher((newValue) => {
    if (
      typeof newValue === "object" &&
      newValue !== null &&
      field in newValue
    ) {
      const currentFieldValue = newValue[field];
      if (currentFieldValue !== previousFieldValue) {
        fn(currentFieldValue);
        previousFieldValue = currentFieldValue;
      }
    }
  });
};

function ok(v) {
  return { ok: v };
}

function err(v) {
  return { err: v };
}

function isOk(r) {
  return r["ok"];
}

function isErr(r) {
  return r["err"];
}

function mapOk(r, f) {
  if (isOk(r)) {
    return ok(f(r["ok"]));
  }
  return r;
}

function flatMapOk(r, f) {
  if (isOk(r)) {
    return f(r["ok"]);
  }
  return r;
}

function bindChain(initialResult, ...fns) {
  return fns.reduce((currentResult, fn) => {
    return flatMapOk(currentResult, fn);
  }, initialResult);
}

let dayInp;
let monthInp;
let yearInp;
let codeInp;
let outputBox;
let errorBox;
let copyButton;
let dayErrorField;
let monthErrorField;
let yearErrorField;
let codeErrorField;
let saveCredButton;
let saveDateContainer;
let mainContainer;
let saveDateButtonYes;
let saveDateButtonNo;

const stateAtom = Atom({
  day: null,
  month: null,
  year: null,
  code: null,
  showDateModal: false,
  activateSavePopupButton: false,
  dateLoadedeFromLocalStorage: false,
  validationError: null,
});

const isNumber = (v) => {
  return Number.parseInt(v) ? ok(v) : err(`liczby sa oczekiwane`);
};

const isGreater = (n) => {
  return function (v) {
    return v >= n ? ok(v) : err(`liczba musi byc powyzej ${n}`);
  };
};

const isLess = (n) => {
  return function (v) {
    return v <= n ? ok(v) : err(`liczba musi byc ponizej ${n}`);
  };
};

const isPositive = (v) => {
  return v > 0 ? ok(v) : err(`musi byc dodatnia`);
};

const notEmptyStr = (s) => {
  return s !== "" ? ok(s) : err("nie moze byc puste");
};

const notContains = (s) => {
  return function (v) {
    return !v.includes(s) ? ok(v) : err(`nie moze zawierac: ${s}`);
  };
};

const validateDay = (val) => {
  return bindChain(ok(val), notEmptyStr, isNumber, isPositive, isLess(31));
};

const validateMonth = (val) => {
  return bindChain(ok(val), notEmptyStr, isNumber, isGreater(0), isLess(12));
};

const validateYear = (val) => {
  return bindChain(ok(val), notEmptyStr, isNumber, isGreater(1950));
};

const validateCode = (val) => {
  return bindChain(
    ok(val),
    notContains("9"),
    notContains("0"),
    notEmptyStr,
    isNumber,
    isGreater(1000),
    isLess(9999),
  );
};

const processInput = ({ val, field, validator, errorField, state }) => {
  const validation = validator(val);
  if (isOk(validation)) {
    errorField.textContent = "";

    state.update((ov) => ({
      ...ov,
      [field]: val,
      validationError: null,
    }));
  } else {
    const errorObj = {
      from: field,
      err: validation.err,
      value: val,
    };

    state.update((ov) => ({
      ...ov,
      validationError: errorObj,
      // [field]: validation
    }));
    // TODO: what to do when valdiation failed
    errorField.textContent = validation["err"];
  }
};

const closePopupsOnOuterClick = () => {
  saveDateContainer.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  saveCredButton.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  saveDateContainer.addEventListener("touchstart", (e) => {
    e.stopPropagation();
  });

  saveCredButton.addEventListener("touchstart", (e) => {
    e.stopPropagation();
  });

  window.addEventListener("click", (_e) => {
    stateAtom.update((ov) => ({ ...ov, showDateModal: false }));
  });

  window.addEventListener(
    "touchstart",
    (e) => {
      e.stopPropagation();
      stateAtom.update((ov) => ({ ...ov, showDateModal: false }));
    },
    { passive: false },
  );
};

const onDOMLoaded = (fn) => {
  document.addEventListener("DOMContentLoaded", fn);
};

const hideDateModal = () => {
  saveDateContainer.classList.remove("show-date-popup");
  mainContainer.classList.remove("blur-background");
  mainContainer.classList.remove("disable-input");
  saveCredButton.classList.remove("disable-input");

  saveDateContainer.classList.add("hide-date-popup");
};

const showDateModal = () => {
  mainContainer.classList.add("blur-background");
  mainContainer.classList.add("disable-input");
  saveDateContainer.classList.add("show-date-popup");
  saveCredButton.classList.add("disable-input");

  saveDateContainer.classList.remove("hide-date-popup");
};

const activateSavePopupButton = () => {
  saveCredButton.addEventListener("click", (_e) => {
    stateAtom.update((ov) => ({
      ...ov,
      showDateModal: true,
      activateSavePopupButton: true,
    }));
  });
};

const saveDateToLocalStorage = () => {
  const { day, month, year } = stateAtom.val();
  if (day && month && year) {
    localStorage.setItem("birthDate", JSON.stringify({ day, month, year }));
  }
};

const initQuerySelectors = () => {
  mainContainer = document.querySelector(".main-container");
  dayInp = document.querySelector(".date-input-container-day>input");
  monthInp = document.querySelector(".date-input-container-month>input");
  yearInp = document.querySelector(".date-input-container-year>input");
  outputBox = document.querySelector(".output-box");
  codeInp = document.querySelector(".code-container>input");
  errorBox = document.querySelector(".output-error");
  copyButton = document.querySelector(".copy-button");
  dayErrorField = document.querySelector(".day-error-field");
  monthErrorField = document.querySelector(".month-error-field");
  yearErrorField = document.querySelector(".year-error-field");
  codeErrorField = document.querySelector(".code-error-field");
  saveCredButton = document.querySelector(".save-credentials-button");
  saveDateContainer = document.querySelector(".save-popup-container");
  saveDateButtonYes = document.querySelector(".save-popup-save-button");
  saveDateButtonNo = document.querySelector(".save-popup-discard-button");
};

const addEventListeners = () => {
  saveDateButtonYes.addEventListener("click", (_e) => {
    stateAtom.update((ov) => ({ ...ov, showDateModal: false }));
    saveDateToLocalStorage();
  });

  saveDateButtonNo.addEventListener("click", (_e) => {
    stateAtom.update((ov) => ({ ...ov, showDateModal: false }));
  });

  dayInp.addEventListener("input", (e) => {
    const val = e.target.value ? e.target.value : "";
    processInput({
      val,
      field: "day",
      validator: validateDay,
      errorField: dayErrorField,
      state: stateAtom,
    });
  });

  monthInp.addEventListener("input", (e) => {
    const val = e.target.value ? e.target.value : "";
    processInput({
      val,
      field: "month",
      validator: validateMonth,
      errorField: monthErrorField,
      state: stateAtom,
    });
  });

  yearInp.addEventListener("input", (e) => {
    const val = e.target.value ? e.target.value : "";
    processInput({
      val,
      field: "year",
      validator: validateYear,
      errorField: yearErrorField,
      state: stateAtom,
    });
  });

  codeInp.addEventListener("input", (e) => {
    const val = e.target.value ? e.target.value : "";
    processInput({
      val,
      field: "code",
      validator: validateCode,
      errorField: codeErrorField,
      state: stateAtom,
    });
  });

  copyButton.addEventListener("click", (_e) => {
    copyText(outputBox);
  });
};

const checkLocalStorage = () => {
  const birthDateStore = localStorage.getItem("birthDate");

  if (birthDateStore) {
    const parsed = JSON.parse(birthDateStore);
    dayInp.value = parsed.day;
    monthInp.value = parsed.month;
    yearInp.value = parsed.year;
    stateAtom.set({ day: parsed.day, month: parsed.month, year: parsed.year });
    stateAtom.update((ov) => ({
      ...ov,
      activateSavePopupButton: true,
      dateLoadedeFromLocalStorage: true,
    }));
  } else {
    stateAtom.update((ov) => ({
      ...ov,
      dateLoadedeFromLocalStorage: false,
    }));
  }
};

onDOMLoaded(() => {
  initQuerySelectors();
  closePopupsOnOuterClick();
  addEventListeners();
  checkLocalStorage();
});

const convertNumTwo = (s) => {
  if (!s) return "";
  const splitted = s.substring(0, 2);

  if (splitted == "00") return "00";

  if (splitted.length < 2 && splitted !== "0") {
    return `0${splitted}`;
  } else {
    return splitted;
  }
};

const genPass = (date, code) => {
  return Array.from(code ?? [])
    .map((x) => date[Number(x) - 1])
    .join("");
};

const formValidDate = (dateObj) => {
  return `${dateObj.year}${convertNumTwo(dateObj.month)}${convertNumTwo(
    dateObj.day,
  )}`;
};

const copyText = (selector) => {
  if (!selector.innerText) return;
  navigator.clipboard.writeText(selector.innerText);

  errorBox.textContent = "Haslo zostalo skopiowano do schowka";
  setTimeout(() => {
    errorBox.textContent = "";
  }, 3000);
};

stateAtom.addWatcher((s) => {
  if (!s.day || !s.month || !s.year) return;

  if (!s.activateSavePopupButton) activateSavePopupButton();

  const sanitizedDate = formValidDate(s);
  const generatedPass = genPass(sanitizedDate, s.code);
  outputBox.textContent = generatedPass;
});

subs(stateAtom, "showDateModal", (v) => {
  if (v) {
    showDateModal();
  } else {
    hideDateModal();
  }
});

subs(stateAtom, "dateLoadedeFromLocalStorage", (d) => {
  if (d) {
    codeInp.focus();
  } else {
    dayInp.focus();
  }
});

subs(stateAtom, "validationError", (v) => {
  if (v && v.from === "code") {
    copyButton.classList.remove("cb-green");
  } else {
    copyButton.classList.add("cb-green");
  }
});
