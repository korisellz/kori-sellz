document.body.insertAdjacentHTML("beforeend", `
  <footer class="site-footer">
    <div class="footer-brand">
      <strong>Kori Sellz</strong>
      <p>Trending tech. Luxury vibes. Everyday prices.</p>
    </div>

    <div class="footer-links">
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
      <a href="/faq.html">FAQ</a>
      <a href="/shipping.html">Shipping</a>
      <a href="/refund.html">Refund Policy</a>
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/terms.html">Terms</a>
      <a href="/track.html">Track Order</a>
    </div>

    <p class="footer-copy">© ${new Date().getFullYear()} Kori Sellz. All rights reserved.</p>
  </footer>
`);
