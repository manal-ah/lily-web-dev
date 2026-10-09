/* ============================================================
   NAVBAR: scroll shadow + mobile menu toggle
   ============================================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 12);
});

const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
navToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ============================================================
   PRICING CARDS -> preselect package in order form
   ============================================================ */
function preselectPackage(value){
  const select = document.getElementById('package');
  select.value = value;
}

/* ============================================================
   EXTRAS BUILDER -> live quote calculator
   ============================================================ */
const pkgPills = document.querySelectorAll('.pkg-pill');
const extraChecks = document.querySelectorAll('.extra-check');
const extrasTotalEl = document.getElementById('extrasTotal');
const extrasSummaryNote = document.getElementById('extrasSummaryNote');

let currentPkg = 'starter';
let currentPkgPrice = 40;
let currentPkgLabel = 'Starter';

function calculateTotal(){
  let total = currentPkgPrice;
  let extrasCount = 0;
  let extrasBreakdown = [];

  extraChecks.forEach(check => {
    if(check.checked){
      const price = parseFloat(check.getAttribute('data-price')) || 0;
      total += price;
      extrasCount++;
      extrasBreakdown.push(check.getAttribute('data-label') + ' (+$' + price + ')');
    }
  });

  extrasTotalEl.textContent = '$' + total;

  if(extrasCount === 0){
    extrasSummaryNote.textContent = currentPkgLabel + ' package, no extras yet';
  } else {
    extrasSummaryNote.textContent = currentPkgLabel + ' package + ' + extrasCount + (extrasCount === 1 ? ' extra' : ' extras');
  }

  return { total, extrasBreakdown };
}

pkgPills.forEach(pill => {
  pill.addEventListener('click', () => {
    pkgPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentPkg = pill.getAttribute('data-package');
    currentPkgPrice = parseFloat(pill.getAttribute('data-price'));
    currentPkgLabel = pill.textContent.trim().split('$')[0].trim();
    calculateTotal();
  });
});

extraChecks.forEach(check => {
  check.addEventListener('change', calculateTotal);
});

// initialize on load
calculateTotal();

function sendQuoteToForm(){
  const packageSelect = document.getElementById('package');
  const { total, extrasBreakdown } = calculateTotal();

  // map the builder's package back to the order form's dropdown values
  const packageMap = {
    starter: 'Starter - $40',
    standard: 'Standard - $75'
  };
  packageSelect.value = packageMap[currentPkg];

  // --- Fill in the visible order summary box inside the order form ---
  const summaryBox = document.getElementById('orderSummaryBox');
  const summaryPackage = document.getElementById('orderSummaryPackage');
  const summaryExtrasList = document.getElementById('orderSummaryExtras');
  const summaryTotal = document.getElementById('orderSummaryTotal');
  const hiddenField = document.getElementById('orderSummaryHidden');

  summaryPackage.textContent = currentPkgLabel + ' package ($' + currentPkgPrice + ')';

  summaryExtrasList.innerHTML = '';
  extrasBreakdown.forEach(line => {
    const match = line.match(/^(.*) \(\+\$(\d+(\.\d+)?)\)$/);
    const li = document.createElement('li');
    if(match){
      li.innerHTML = '<span>' + match[1] + '</span><span>+$' + match[2] + '</span>';
    } else {
      li.innerHTML = '<span>' + line + '</span>';
    }
    summaryExtrasList.appendChild(li);
  });

  summaryTotal.textContent = '$' + total;
  summaryBox.style.display = 'block';

  // --- Also store a plain-text version in a hidden field, so it's
  //     included in the email you receive when the client submits ---
  let plainSummary = currentPkgLabel + ' package ($' + currentPkgPrice + ')';
  if(extrasBreakdown.length){
    plainSummary += ' + extras: ' + extrasBreakdown.join(', ');
  }
  plainSummary += '. Estimated total: $' + total + '.';
  hiddenField.value = plainSummary;
}

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
document.querySelectorAll('.faq-item').forEach(item => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach(other => {
      if(other !== item){
        other.classList.remove('open');
        other.querySelector('.faq-answer').style.maxHeight = null;
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      }
    });

    if(isOpen){
      item.classList.remove('open');
      answer.style.maxHeight = null;
      question.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
      question.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ============================================================
   ORDER FORM: submits to Formspree (see action="" in the HTML)
   so submissions are emailed to you. The client always sees a
   friendly confirmation either way.
   ============================================================ */
const orderForm = document.getElementById('orderForm');
const formSuccess = document.getElementById('formSuccess');

orderForm.addEventListener('submit', function(e){
  e.preventDefault();

  if(!orderForm.checkValidity()){
    orderForm.reportValidity();
    return;
  }

  const formData = new FormData(orderForm);
  const submitBtn = orderForm.querySelector('button[type="submit"]');
  if(submitBtn){
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
  }

  fetch(orderForm.action, {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' }
  })
    .then(response => {
      if(!response.ok){
        console.error('Formspree responded with an error status:', response.status);
      }
    })
    .catch(err => {
      console.error('Order submission did not reach Formspree:', err);
    })
    .finally(() => {
      orderForm.style.display = 'none';
      formSuccess.classList.add('show');
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});
