# AMD Shares Dashboard (static site)

This is a production-ready, static GitHub Pages site that fetches SEC XBRL data for a company and displays the highest and lowest reported shares outstanding.

Note: This project runs entirely in the browser (no backend) and uses localStorage for data persistence.

## What you get
- A responsive, mobile-friendly UI that shows:
  - Entity name
  - Max shares value with fiscal year
  - Min shares value with fiscal year
- Data is fetched from SEC's endpoint:
  - https://data.sec.gov/api/xbrl/companyconcept/CIK<CIK>/dei/EntityCommonStockSharesOutstanding.json
  - If you open with a URL like index.html?CIK=0001018724, the site will fetch for the corresponding CIK via a lightweight proxy (to bypass CORS) and update the page without reloading.
- Data is saved to localStorage as data.json with the structure:
  {
    "entityName": "XYZ",
    "max": { "val": 123, "fy": "2022" },
    "min": { "val": 45,  "fy": "2021" }
  }
- uid.txt (attachment) is expected to be present in the repo and used by the app if provided (see below).

## How to use
1. Open index.html directly in a browser (no server required).
2. The page loads data for AMD by default.
3. To view another company, append ?CIK=XXXXXXXXXX to the URL, e.g. index.html?CIK=0001018724.
4. You can download the persisted data.json from the page by clicking the Download button.

## Implementation details
- Pure HTML/CSS/JavaScript (no frameworks)
- Data persistence via localStorage
- Error handling and input validation are included
- Attaches to the SEC endpoint with a graceful fallback proxy if needed

## File overview
- index.html: Main HTML document (live entity name and IDs required by the spec)
- styles.css: Responsive styling
- script.js: All data fetching, parsing, validation, and UI updates
- README.md: This file (documentation)

## License
MIT

## About uid.txt
The repository includes uid.txt as an attachment (content must match the provided attachment). Add uid.txt in the repo with the exact content you received.
