/* Money Mystery Daily: puzzle data (30 days, then the rotation loops).
   Day 1 = 2026-10-26 = puzzles[0]. Clues run hardest first; each clue carries the source URL(s) it came from.
   Every fact and URL is taken from the researched source lists of the Big Money Math eBooks:
     out/kdp/ebook-how-companies/sources.md (primary), out/kdp/ebook-subscription-trap/sources.md, out/kdp/ebook-money-math/sources.md
   test_game.mjs checks every URL against those files, and that no clue names its company (answer + aliases).
   aliases: words that would give the answer away (product, program or brand names); matched as whole words. */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------------------------- sources
  var S = {
    COST: 'https://www.sec.gov/Archives/edgar/data/0000909832/000090983226000093/cost-20260830.htm',
    HOTDOG: 'https://www.kfvs12.com/2026/04/29/costcos-iconic-150-hot-dog-combo-debuts-new-change-first-time-decades/',
    CHICKEN15: 'https://fortune.com/2015/05/29/costco-chicken-prices/',
    CHICKEN23: 'https://foxbusiness.com/lifestyle/costco-maintaining-rotisserie-chicken-prices',
    MCD10K: 'https://www.sec.gov/Archives/edgar/data/63908/000006390826000035/mcd-20251231.htm',
    MCDQ1: 'https://www.sec.gov/Archives/edgar/data/63908/000006390825000025/mcd-20250331.htm',
    SBUX: 'https://www.sec.gov/Archives/edgar/data/829224/000082922425000114/sbux-20250928.htm',
    SBUXTERMS: 'https://www.starbucks.com/terms/manage-gift-cards/',
    KOPR: 'https://investors.coca-colacompany.com/news-events/press-releases/detail/1151/coca-cola-reports-fourth-quarter-and-full-year-2025-results',
    KO10K: 'https://www.sec.gov/Archives/edgar/data/21344/000162828026010047/ko-20251231.htm',
    BOTTLER: 'https://www.sec.gov/Archives/edgar/data/317540/000162828026009057/coke-20251231.htm',
    HPQ: 'https://www.sec.gov/Archives/edgar/data/47217/000004721725000071/hpq-20251031.htm',
    HPCEO: 'https://www.techspot.com/community/topics/hp-ceo-says-customers-who-dont-use-the-companys-supplies-are-bad-investments.284030/',
    HPFIRM: 'https://www.theregister.com/2018/09/21/hp_should_pay_out_15m_for_printer_bricking_update/',
    HPINK: 'https://www.hp.com/us-en/printers/instant-ink.html',
    HPINK23: 'https://web.archive.org/web/20230601184856/https://www.hp.com/us-en/printers/instant-ink.html',
    AMC10K: 'https://www.sec.gov/Archives/edgar/data/1411579/000141157926000016/amc-20251231x10k.htm',
    AMCPR: 'https://www.sec.gov/Archives/edgar/data/1411579/000141157926000018/amc-20260223xex99d1.htm',
    DALIR: 'https://ir.delta.com/news/news-details/2026/Delta-Air-Lines-Announces-December-Quarter-and-Full-Year-2025-Financial-Results/default.aspx',
    DAL10K: 'https://www.sec.gov/Archives/edgar/data/27904/000002790426000013/dal-20251231.htm',
    DAL9B: 'https://ir.delta.com/news/news-details/2020/Delta-Air-Lines-Announces-Upsize-of-SkyMiles-Financing-to-9-Billion/default.aspx',
    AAPL: 'https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm',
    APPSTORE: 'https://www.businesswire.com/news/home/20201118005376/en/Apple-Announces-App-Store-Small-Business-Program',
    AMZNARS: 'https://www.sec.gov/Archives/edgar/data/1018724/000110465926041036/tm263815d4_ars.pdf',
    AMZNADS: 'https://www.marketingdive.com/news/amazon-annual-ad-revenue-passes-68b-boosted-by-full-funnel-strategy/',
    FTCAMZ: 'https://www.ftc.gov/system/files/ftc_gov/pdf/2023-09-20-067-AmendedComplaint(redacted).pdf',
    FTCAMZSET: 'https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-secures-historic-25-billion-settlement-against-amazon',
    AMZNAP: 'https://abc7news.com/post/amazon-pay-25-billion-settle-ftc-allegations-duped-customers-enrolling-prime/17881451/',
    PRIME05: 'https://www.sec.gov/Archives/edgar/data/1018724/000119312505017451/dex991.htm',
    PRIME22: 'https://www.nbclosangeles.com/news/business/money-report/amazon-increases-the-price-of-prime-nearly-17-to-139-per-year/2816397/',
    PRIME26: 'https://www.dealnews.com/features/amazon-prime/cost/',
    RACE: 'https://www.ferrari.com/content/dam/ferrari-fcom/news/corporate/2026/02/pdf/2026_02_10%20-%20Ferrari%20FY%202025%20Results%20Press%20Release.pdf',
    VQ4: 'https://www.sec.gov/Archives/edgar/data/1403161/000140316125000077/q42025earningsrelease.htm',
    V10K: 'https://www.sec.gov/Archives/edgar/data/1403161/000140316125000089/v-20250930.htm',
    V10K20: 'https://www.sec.gov/Archives/edgar/data/1403161/000140316120000070/v-20200930.htm',
    VSUR: 'https://www.afslaw.com/perspectives/alerts/visa-reduces-its-merchant-surcharge-cap-3-effective-april-15-2023-merchants',
    NFLXQ424: 'https://www.sec.gov/Archives/edgar/data/1065280/000106528025000033/ex991_q424.htm',
    NFLXQ425: 'https://www.sec.gov/Archives/edgar/data/1065280/000106528026000033/ex991_q425.htm',
    NFLX10K: 'https://www.sec.gov/Archives/edgar/data/1065280/000106528026000034/nflx-20251231.htm',
    NFLX15: 'https://www.engadget.com/2015/10/08/netflix-streaming-price-increase/',
    CPI: 'https://data.bls.gov/timeseries/CUUR0000SA0',
    NFLX26: 'https://www.cnbc.com/2026/03/26/netflix-raises-prices-across-all-streaming-plans.html',
    NFLX10: 'https://tidbits.com/2010/11/28/netflix-offers-streaming-only-plan-raises-other-prices/',
    NFLXADS: 'https://www.fox13news.com/news/netflix-raising-prices-again-all-plans-how-much-more-youll-be-paying',
    PEPWIKI: 'https://en.wikipedia.org/wiki/Leonard_v._Pepsico,_Inc.',
    PEPMF: 'https://www.mentalfloss.com/history/law/pepsi-harrier-jet-lawsuit-history',
    PTON: 'https://www.sec.gov/Archives/edgar/data/1639825/000163982526000038/pton-20260630.htm',
    PTON95: 'https://www.sec.gov/Archives/edgar/data/1639825/000163982524000120/q42024shareholderletter.htm',
    KR10K: 'https://www.sec.gov/Archives/edgar/data/56873/000110465926037723/kr-20260131x10k.htm',
    KRQ4: 'https://s202.q4cdn.com/463742399/files/doc_financials/2025/q4/FINAL-v4-KR-Q4-FY25-Earnings-Presentation-tables.pdf',
    ADBE12: 'https://www.sec.gov/Archives/edgar/data/0000796343/000079634313000008/adbe10kfy12.htm',
    ADBE13: 'https://www.sec.gov/Archives/edgar/data/0000796343/000079634314000004/adbe10kfy13.htm',
    ADBE25: 'https://www.sec.gov/Archives/edgar/data/796343/000079634326000003/adbe-20251128.htm',
    ADBEDOJ: 'https://www.justice.gov/opa/pr/adobe-agrees-150-million-settlement-and-injunction-resolve-alleged-violations-restore-online',
    ADBEFTC: 'https://www.ftc.gov/news-events/news/press-releases/2024/06/ftc-takes-action-against-adobe-executives-hiding-fees-preventing-consumers-easily-cancelling',
    ADBEHELP: 'https://helpx.adobe.com/account-billing-next/manage-plan/cancel-plan/after-cancellation.html',
    UALVAL: 'https://aviationweek.com/air-transport/airlines-lessors/united-airlines-raises-5b-backed-loyalty-program',
    UALFIN: 'https://mayerbrown.com/en/news/2020/07/mayer-brown-advises-banks-on-financing-for-united-airlines-mileageplus-loyalty-program',
    UALDYN: 'https://onemileatatime.com/united-mileageplus-award-chart-devaluation',
    UALPART: 'https://thepointsguy.com/news/united-pulls-partner-award-chart',
    TSLA1: 'https://www.cnbc.com/2026/01/14/musk-tesla-full-self-driving-subscription-fsd.html',
    TSLA2: 'https://www.cnbc.com/2026/10/09/tesla-full-self-driving-europe-regulator.html',
    SPOT20F: 'https://www.sec.gov/Archives/edgar/data/1639920/000162828026006874/ck0001639920-20251231.htm',
    SPOT11: 'https://www.deseret.com/entertainment/2026/01/15/spotify-raises-prices/',
    SPOT26: 'https://www.techcrunch.com/2026/01/15/spotify-raises-its-subscription-prices-in-the-u-s-again/',
    DECOY: 'https://en.wikipedia.org/wiki/Decoy_effect',
    DECOY2: 'https://www.mindtools.com/a3wrd70/mind-tricks-is-decision-making-always-rational/',
    PLNT10K: 'https://www.sec.gov/Archives/edgar/data/1637207/000163720726000011/plnt-20251231.htm',
    PLNTPR: 'https://www.sec.gov/Archives/edgar/data/1637207/000163720726000009/plntq42025pressreleaseex991.htm',
    FORD: 'https://s205.q4cdn.com/882619693/files/doc_financials/2025/q4/Ford-Q4-2025-Earnings-Press-Release.pdf',
    GP25: 'https://www.cnbc.com/2025/10/01/microsoft-price-hike-xbox-game-pass-ultimate.html',
    GP26: 'https://news.xbox.com/en-us/2026/04/21/xbox-game-pass-update/',
    GP26C: 'https://www.cnbc.com/2026/04/21/microsoft-game-pass-ultimate-subscription-price-cut.html',
    MSFT25: 'https://www.sec.gov/Archives/edgar/data/789019/000095017025100235/msft-20250630.htm',
    M365: 'https://www.nbcsandiego.com/news/business/money-report/microsoft-raises-price-of-consumer-version-of-microsoft-365-for-first-time-in-12-years/3725922',
    JCP: 'https://www.jckonline.com/editorial-article/jc-penney-lost-nearly-1-billion-in-2012/',
    JCPT: 'https://business.time.com/?p=77302',
    AAVAL: 'https://www.doctorofcredit.com/recap-airline-labor-unions-want-another-bailout-aa-valuing-aadvantage-at-19-5-billion-more/',
    AA10B: 'https://www.sec.gov/Archives/edgar/data/4515/000000620121000024/aex991securednotespricingp.htm',
    AA8K: 'https://www.sec.gov/Archives/edgar/data/6201/000000620124000066/aal-20241205.htm',
    STUBH: 'https://newsroom.haas.berkeley.edu/?p=23186',
    STUBY: 'https://tobin.yale.edu/sites/default/files/2022-11/PriceSalience.pdf',
    FTCFEE: 'https://www.ftc.gov/system/files/ftc_gov/pdf/r207011_udf_rule_2024_final_0.pdf',
    DIS19: 'https://www.cnbc.com/2019/04/11/disney-plus-will-be-available-starting-november-12-for-6point99-a-month.html',
    DIS26: 'https://www.cbsnews.com/news/disney-plus-hulu-price-increase/',
    BMW: 'https://ca.news.yahoo.com/good-news-bmw-owners-wont-064303928.html',
    WSM: 'https://cognition.aau.at/bg/BA/Simon%20&%20tversky,%201992.pdf',
    TOY: 'https://www.toyota.com/connected-services/',
    TOYM: 'https://www.motor1.com/news/554620/toyota-subscription-fee-remote-start/',
    MBZ: 'https://www.thedrive.com/news/mercedes-updates-performance-subscriptions-with-monthly-yearly-and-lifetime-options'
  };

  var AIRLINES = ['Delta Air Lines', 'United Airlines', 'American Airlines', 'Southwest Airlines', 'JetBlue', 'Alaska Airlines'];
  function others(list, answer) { return list.filter(function (x) { return x !== answer; }); }

  // ---------------------------------------------------------------------------------------------- puzzles
  var PUZZLES = [
    { id: 'costco', answer: 'Costco', world: 'Retail', aliases: ['Kirkland'],
      decoys: ['Walmart', 'Target', "Sam's Club", "BJ's Wholesale Club", 'Kroger'],
      clues: [
        { text: 'Its membership fees came to $5.9 billion in fiscal 2026, about half of its $11.7 billion operating income.', src: [S.COST] },
        { text: 'In the US and Canada, 92.3% of its members renewed in fiscal 2026. Worldwide, 89.8% did.', src: [S.COST] },
        { text: 'In 2015 its finance chief said it was willing to give up $30 to $40 million a year in margin to keep its rotisserie chicken at $4.99.', src: [S.CHICKEN15] },
        { text: 'Its hot dog and soda combo has cost $1.50 since 1985. It sold more than 245 million of them in fiscal 2025.', src: [S.HOTDOG] }
      ],
      explain: 'Costco keeps under four cents of operating income per dollar of sales, so the groceries are not where the money is. Membership fees of $5.9 billion, renewed by more than 9 in 10 US and Canadian members, cover about half its operating income. In 2023 its finance chief called low prices like the $4.99 chicken an investment that drives membership.',
      explainSrc: [S.COST, S.CHICKEN23] },

    { id: 'mcdonalds', answer: "McDonald's", world: 'Restaurants', aliases: ['McDonald', 'Big Mac', 'Golden Arches'],
      decoys: ['Burger King', "Wendy's", 'Subway', 'KFC', 'Taco Bell'],
      clues: [
        { text: 'At the end of 2025 it owned about 56% of the land and 80% of the buildings for its restaurants in its consolidated markets.', src: [S.MCD10K] },
        { text: 'In the first three months of 2025, its franchisees paid it $2.3 billion in rent and $1.3 billion in royalties.', src: [S.MCDQ1] },
        { text: 'In 2025 it kept $13.9 billion of margin from $16.5 billion of franchise revenue, about 84 cents per dollar.', src: [S.MCD10K] },
        { text: 'About 95% of its 45,356 restaurants are run by franchisees.', src: [S.MCD10K] }
      ],
      explain: "McDonald's earns much of its money as a landlord. It generally owns or leases the land and building, then collects rent and royalties based on a percent of each franchisee's sales. Rent alone brought in more than royalties, and franchise revenue kept 84 cents of margin per dollar in 2025.",
      explainSrc: [S.MCD10K, S.MCDQ1] },

    { id: 'delta', answer: 'Delta Air Lines', world: 'Airlines', aliases: ['Delta', 'SkyMiles'],
      decoys: others(AIRLINES, 'Delta Air Lines'),
      clues: [
        { text: "Its credit card partner paid it $8.2 billion in 2025, about $2 billion more than the airline's whole profit before taxes.", src: [S.DALIR, S.DAL10K] },
        { text: 'At the end of 2025 it owed travelers $9.3 billion in unused miles, recorded as deferred revenue.', src: [S.DAL10K] },
        { text: 'In 2020 it raised $9 billion of financing backed by its frequent flyer program.', src: [S.DAL9B] },
        { text: "Its annual report calls its co-brand credit card deal with American Express its 'most significant and valuable contract to sell miles'.", src: [S.DAL10K] }
      ],
      explain: "Delta sells miles as well as seats. Banks buy miles to hand out as card rewards, and American Express paid Delta $8.2 billion in 2025, more than Delta's $6.2 billion profit before taxes. The program is valuable enough that Delta raised $9 billion of financing against it in 2020.",
      explainSrc: [S.DALIR, S.DAL10K, S.DAL9B] },

    { id: 'apple', answer: 'Apple', world: 'Tech', aliases: ['iPhone', 'iPad', 'Mac', 'iCloud', 'App Store'],
      decoys: ['Samsung', 'Google', 'Microsoft', 'Sony', 'Meta'],
      clues: [
        { text: 'In fiscal 2025 its services kept 75.4 cents of gross profit per dollar of sales, against 36.8 cents on the devices it sells.', src: [S.AAPL] },
        { text: 'Services were about 26% of its sales but 42% of its gross profit.', src: [S.AAPL] },
        { text: 'Its app marketplace takes a 15% commission from developers earning up to $1 million a year, and 30% above that.', src: [S.APPSTORE] },
        { text: 'Its best-selling phone brought in $209.6 billion in fiscal 2025, about half of its $416.2 billion in sales.', src: [S.AAPL] }
      ],
      explain: 'Apple sells hardware, but its best margins come from what runs on it. Services such as advertising, the App Store and cloud services kept 75.4 cents of gross profit per dollar, about double the hardware rate. With 26% of sales, they delivered 42% of its gross profit.',
      explainSrc: [S.AAPL] },

    { id: 'ferrari', answer: 'Ferrari', world: 'Cars', aliases: ['Maranello'],
      decoys: ['Lamborghini', 'Porsche', 'Aston Martin', 'McLaren', 'Tesla'],
      clues: [
        { text: 'It shipped 112 fewer cars in 2025 than in 2024, yet its revenue rose 7%.', src: [S.RACE] },
        { text: 'Its 2025 net profit came to about €117,000 for every car it delivered.', src: [S.RACE] },
        { text: "Its order book stretched toward the end of 2027, and it calls its approach a 'carefully-managed volume strategy'.", src: [S.RACE] },
        { text: 'It delivered just 13,640 cars in 2025. Personalizations and a richer mix of models pushed revenue up.', src: [S.RACE] }
      ],
      explain: 'Ferrari keeps supply below demand on purpose. It delivered 13,640 cars in 2025, fewer than the year before, while revenue grew 7% on a richer model mix and personalizations. That scarcity let it earn about €117,000 of net profit per car.',
      explainSrc: [S.RACE] },

    { id: 'starbucks', answer: 'Starbucks', world: 'Restaurants', aliases: ['Stars'],
      decoys: ["Dunkin'", 'Tim Hortons', 'Dutch Bros', "Peet's Coffee", 'Costa Coffee'],
      clues: [
        { text: 'In fiscal 2025 it booked $222.4 million of revenue from prepaid balances it expects will never be spent.', src: [S.SBUX] },
        { text: "At the end of September 2025, customers' prepaid card balances and unredeemed loyalty rewards totaled $1.75 billion.", src: [S.SBUX] },
        { text: 'Its card terms say the money you load is not FDIC insured and earns no interest.', src: [S.SBUXTERMS] },
        { text: 'You load money onto its card or app to pay for coffee, and its reward points generally expire after six to twelve months.', src: [S.SBUX] }
      ],
      explain: 'Starbucks gets your money before you get your coffee. Prepaid balances and loyalty rewards it still owed came to $1.75 billion, money that earns you no interest. Balances it expects nobody will spend turned into $222.4 million of revenue in fiscal 2025.',
      explainSrc: [S.SBUX, S.SBUXTERMS] },

    { id: 'netflix', answer: 'Netflix', world: 'Streaming', aliases: [],
      decoys: ['Disney+', 'Hulu', 'HBO Max', 'Paramount+', 'Peacock'],
      clues: [
        { text: 'In 2025 it stopped reporting its paid membership count every quarter and now shares only milestones. It crossed 325 million late that year.', src: [S.NFLXQ424, S.NFLXQ425] },
        { text: 'Its 2025 revenue grew 16% to $45.2 billion, driven by more members, price increases and advertising.', src: [S.NFLX10K] },
        { text: 'Its US standard plan cost $9.99 in 2015. Inflation alone would have taken that to about $14.15 by 2026; the actual price is $19.99.', src: [S.NFLX15, S.CPI, S.NFLX26] },
        { text: 'Its streaming-only plan launched at $7.99 a month in November 2010.', src: [S.NFLX10] }
      ],
      explain: 'Netflix has raised prices step by step while its membership kept growing. Its US standard plan went from $9.99 in 2015 to $19.99 in 2026, well ahead of inflation. An $8.99 plan with ads adds advertising money on top.',
      explainSrc: [S.NFLX15, S.CPI, S.NFLX26, S.NFLXQ424, S.NFLXQ425, S.NFLXADS] },

    { id: 'hp', answer: 'HP', world: 'Tech', aliases: ['Hewlett', 'Packard', 'Instant Ink'],
      decoys: ['Canon', 'Epson', 'Brother', 'Dell', 'Xerox'],
      clues: [
        { text: 'In fiscal 2025 its ink and toner brought in $10.9 billion, almost twice the $5.8 billion it made from the printers.', src: [S.HPQ] },
        { text: "In January 2024 its CEO said a printer customer who doesn't use its supplies is a 'bad investment'.", src: [S.HPCEO] },
        { text: 'A 2016 software update made some of its printers reject third-party cartridges. It later agreed to a $1.5 million US settlement.', src: [S.HPFIRM] },
        { text: "Its ink subscription's cheapest plan, 10 pages a month, cost $0.99 in 2023 and $1.99 in October 2026.", src: [S.HPINK23, S.HPINK] }
      ],
      explain: 'HP sells the printer to sell the ink. Supplies made up 65% of its printing revenue in fiscal 2025, and its CEO has called customers who skip its cartridges a bad investment. The printer is the hook; the refills are the profit.',
      explainSrc: [S.HPQ, S.HPCEO] },

    { id: 'coca-cola', answer: 'Coca-Cola', world: 'Drinks', aliases: ['Coca', 'Coke'],
      decoys: ['PepsiCo', 'Keurig Dr Pepper', 'Nestlé', 'Red Bull', 'Monster Beverage'],
      clues: [
        { text: 'Its operating margin was 28.7% in 2025. Its largest US bottling partner made 13.2%.', src: [S.KOPR, S.BOTTLER] },
        { text: 'Selling concentrate to bottlers was 85% of its volume and 59% of its revenue in 2025. Independent partners do most of the bottling and delivery.', src: [S.KO10K] },
        { text: 'Its 2025 revenue of $47.9 billion works out to roughly 6 cents per serving of its drinks.', src: [S.KOPR, S.KO10K] },
        { text: 'People drink about 2.2 billion servings of its brands every day, out of an estimated 65 billion drink servings worldwide.', src: [S.KO10K] }
      ],
      explain: 'Coca-Cola mostly sells flavor, not bottles. It makes concentrate and leaves the costly bottling, trucking and selling to independent partners. That is why it kept 28.7 cents of operating profit per revenue dollar in 2025, while its largest US bottler kept 13.2 cents.',
      explainSrc: [S.KO10K, S.KOPR, S.BOTTLER] },

    { id: 'amazon', answer: 'Amazon', world: 'Tech', aliases: ['AWS', 'Prime', 'Alexa', 'Kindle'],
      decoys: ['Walmart', 'Microsoft', 'Google', 'eBay', 'Alibaba'],
      clues: [
        { text: 'Its cloud computing arm was 18% of its 2025 sales but 57% of its operating income.', src: [S.AMZNARS] },
        { text: 'It sold more than $68 billion of advertising in 2025.', src: [S.AMZNADS] },
        { text: 'In a 2023 complaint, the FTC said canceling its membership took four pages, six clicks and 15 options. It settled in 2025 for $2.5 billion, admitting no wrongdoing.', src: [S.FTCAMZ, S.FTCAMZSET, S.AMZNAP] },
        { text: 'Its fast-shipping membership started at $79 a year in 2005 and has cost $139 a year since 2022.', src: [S.PRIME05, S.PRIME22, S.PRIME26] }
      ],
      explain: "Amazon's store runs on thin margins: outside its cloud arm, it earned about 6 cents of operating income per dollar of sales in 2025. The profit engine is renting out computing power, which produced 57% of its operating income, with advertising and membership fees adding more.",
      explainSrc: [S.AMZNARS, S.AMZNADS] },

    { id: 'amc', answer: 'AMC Theatres', world: 'Entertainment', aliases: ['AMC'],
      decoys: ['Regal Cinemas', 'Cinemark', 'Marcus Theatres', 'Alamo Drafthouse', 'IMAX'],
      clues: [
        { text: 'In 2025 the food it sold cost it only about 20 cents per dollar of food and drink sales.', src: [S.AMC10K] },
        { text: 'About 48 cents of every dollar of its ticket sales went out as film costs in 2025.', src: [S.AMCPR] },
        { text: 'Its average customer spent $7.62 on food and drinks per visit, next to an average ticket price of $12.09.', src: [S.AMCPR] },
        { text: "After those direct costs, it kept about $6.13 from each guest's popcorn and soda, almost the $6.28 it kept from the ticket.", src: [S.AMCPR] }
      ],
      explain: 'AMC sells tickets, but nearly half of every ticket dollar goes out as film costs. Snacks are different: the food costs about 20 cents per dollar. Before staff and rent, a guest\'s popcorn and soda leave AMC about $6.13, close to the $6.28 left from the ticket.',
      explainSrc: [S.AMC10K, S.AMCPR] },

    { id: 'visa', answer: 'Visa', world: 'Finance', aliases: [],
      decoys: ['Mastercard', 'American Express', 'PayPal', 'Discover', 'JPMorgan Chase'],
      clues: [
        { text: 'It processed 257.5 billion transactions in fiscal 2025 and kept about 60 cents of operating income per dollar of net revenue.', src: [S.VQ4, S.V10K] },
        { text: 'In April 2023 it lowered the most a US store may add as a credit card surcharge on its network from 4% to 3%.', src: [S.VSUR] },
        { text: "It doesn't issue cards, lend money or set the interest rates you pay. Banks do that.", src: [S.V10K20] },
        { text: 'Its $40.0 billion of net revenue in fiscal 2025 averages out to about 15.5 cents per transaction it processed.', src: [S.VQ4] }
      ],
      explain: 'Visa runs the payment network, not the loans. Banks issue the cards, lend the money and carry the risk, while Visa earns fees for routing and approving payments. A few cents on 257.5 billion transactions added up to $40.0 billion of net revenue in fiscal 2025.',
      explainSrc: [S.V10K20, S.V10K, S.VQ4] },

    { id: 'pepsico', answer: 'PepsiCo', world: 'Drinks', aliases: ['Pepsi'],
      decoys: ['Coca-Cola', 'Keurig Dr Pepper', 'Nestlé', 'Red Bull', 'Unilever'],
      clues: [
        { text: "In 1999 a federal judge ruled that one of its TV ad offers was 'evidently done in jest'.", src: [S.PEPWIKI] },
        { text: 'A 21-year-old business student mailed it $700,008.50, including $10 for shipping, to claim a prize from that ad.', src: [S.PEPWIKI] },
        { text: "Later it changed the ad: the prize now cost 700,000,000 points, with 'Just kidding' added.", src: [S.PEPMF] },
        { text: 'Its 1996 ad showed a Harrier jet for 7,000,000 points earned from its drinks. Extra points could be bought for 10 cents each.', src: [S.PEPWIKI] }
      ],
      explain: 'In 1996 PepsiCo ran a points-for-prizes campaign, and one ad jokingly priced a Harrier jet at 7,000,000 points. Because extra points could be bought for 10 cents each, a student sent $700,008.50 and asked for the jet; the court sided with PepsiCo. The company that issues points decides what they can buy.',
      explainSrc: [S.PEPWIKI, S.PEPMF] },

    { id: 'peloton', answer: 'Peloton', world: 'Fitness', aliases: [],
      decoys: ['NordicTrack', 'Tonal', 'Garmin', 'Fitbit', 'Lululemon'],
      clues: [
        { text: 'In its fiscal year to June 2026, subscriptions were 69% of its revenue but 93% of its gross profit.', src: [S.PTON] },
        { text: 'Its equipment earned an 11.7% gross margin. Its monthly memberships earned 71.4%.', src: [S.PTON] },
        { text: 'In 2024 it announced a one-time $95 fee to activate its equipment when bought secondhand in the US.', src: [S.PTON95] },
        { text: 'It sold $770.4 million of connected fitness equipment and $1.68 billion of subscriptions in the year to June 2026.', src: [S.PTON] }
      ],
      explain: 'Peloton barely profits on the hardware. Equipment kept an 11.7% gross margin while memberships kept 71.4%, so subscriptions delivered 93% of its gross profit. The machine gets you in the door; the monthly fee is the business.',
      explainSrc: [S.PTON] },

    { id: 'kroger', answer: 'Kroger', world: 'Retail', aliases: [],
      decoys: ['Walmart', 'Albertsons', 'Publix', 'Target', 'Costco'],
      clues: [
        { text: 'Its side businesses, including selling ads to brands, made $1.5 billion of operating profit in 2025, about 31% of its adjusted total.', src: [S.KRQ4, S.KR10K] },
        { text: 'Over 95% of its customer transactions are tied to a loyalty card.', src: [S.KR10K] },
        { text: 'The supermarket chain serves about 63 million households a year.', src: [S.KR10K] }
      ],
      explain: 'Kroger sells groceries, but its loyalty card turns shopping into data. With more than 95% of transactions tied to a card, it sells targeted advertising to brands through its Precision Marketing arm. Those side businesses, ads included, made $1.5 billion of operating profit in 2025.',
      explainSrc: [S.KR10K, S.KRQ4] },

    { id: 'adobe', answer: 'Adobe', world: 'Software', aliases: ['Photoshop', 'Creative Cloud', 'Acrobat'],
      decoys: ['Microsoft', 'Autodesk', 'Canva', 'Salesforce', 'Corel'],
      clues: [
        { text: 'Subscriptions were 15% of its revenue in fiscal 2012 and 96% in fiscal 2025.', src: [S.ADBE12, S.ADBE25] },
        { text: 'After it said new features would go only to subscribers, revenue in its digital media business fell $476 million in fiscal 2013.', src: [S.ADBE13] },
        { text: 'In March 2026 it agreed to a $150 million settlement to resolve claims about hidden early-cancellation fees and hard cancellation, while denying wrongdoing.', src: [S.ADBEDOJ, S.ADBEFTC] },
        { text: 'Cancel your plan and its paid creative apps stop working, and your cloud storage drops to 2 GB.', src: [S.ADBEHELP] }
      ],
      explain: 'Adobe stopped selling its software outright and started renting it. Revenue grew from $4.4 billion in fiscal 2012 to $23.8 billion in fiscal 2025, with subscriptions rising from 15% to 96% of the total. Once you stop paying, the apps stop working.',
      explainSrc: [S.ADBE12, S.ADBE25, S.ADBEHELP] },

    { id: 'united', answer: 'United Airlines', world: 'Airlines', aliases: ['United', 'MileagePlus'],
      decoys: others(AIRLINES, 'United Airlines'),
      clues: [
        { text: 'In June 2020 it valued its frequent flyer program at about $21.9 billion.', src: [S.UALVAL] },
        { text: 'In July 2020 it closed a $6.8 billion financing deal secured by that program.', src: [S.UALFIN] },
        { text: 'From November 2019 its award flights had no fixed price chart, with no minimum or maximum. It dropped its partner award chart in April 2020.', src: [S.UALDYN, S.UALPART] }
      ],
      explain: "United's loyalty program is valuable on its own: in 2020 United put its value at about $21.9 billion and borrowed $6.8 billion against it. Since award prices went dynamic in 2019, with no minimum or maximum, United decides how many miles a seat costs.",
      explainSrc: [S.UALVAL, S.UALFIN, S.UALDYN] },

    { id: 'tesla', answer: 'Tesla', world: 'Cars', aliases: ['Musk', 'FSD', 'Full Self-Driving', 'Autopilot'],
      decoys: ['Ford', 'General Motors', 'Rivian', 'BMW', 'Mercedes-Benz'],
      clues: [
        { text: 'Over ten years its driver-assistance subscription would cost $11,880. Until February 2026 you could buy the software outright for $8,000.', src: [S.TSLA1] },
        { text: 'In January 2026 its CEO said it would stop selling that software outright after February 14 and offer it only as a monthly subscription.', src: [S.TSLA1] },
        { text: 'The subscription starts at $99 a month, and was still $99 in the US in October 2026.', src: [S.TSLA1, S.TSLA2] }
      ],
      explain: 'Tesla switched its driver-assistance software from a one-time $8,000 purchase to a subscription starting at $99 a month. That turns one sale into a monthly bill: over ten years, $99 a month adds up to $11,880, or $3,880 more than the old price.',
      explainSrc: [S.TSLA1, S.TSLA2] },

    { id: 'spotify', answer: 'Spotify', world: 'Streaming', aliases: [],
      decoys: ['Apple Music', 'YouTube Music', 'Amazon Music', 'Pandora', 'SiriusXM'],
      clues: [
        { text: 'Paying subscribers bring in 89% of its revenue, even though it also runs a free, ad-supported tier.', src: [S.SPOT20F] },
        { text: 'It had 290 million paying subscribers at the end of 2025.', src: [S.SPOT20F] },
        { text: 'Its US individual plan launched at $9.99 a month in 2011, then rose to $10.99 in 2023, $11.99 in 2024 and $12.99 in January 2026.', src: [S.SPOT11, S.SPOT26] }
      ],
      explain: 'Spotify gives music away for free to get you to pay. The free tier runs on ads, but subscribers bring in 89% of revenue, and the US individual plan has gone from $9.99 to $12.99. Each rise was a single dollar a month.',
      explainSrc: [S.SPOT20F, S.SPOT11, S.SPOT26] },

    { id: 'economist', answer: 'The Economist', world: 'Media', aliases: ['Economist'],
      decoys: ['The New York Times', 'The Wall Street Journal', 'Financial Times', 'The Atlantic', 'Time'],
      clues: [
        { text: 'Removing one option that nobody chose cut the share of students picking its $125 bundle from 84% to 32%.', src: [S.DECOY] },
        { text: 'The offer: web only for $59, print only for $125, or print plus web for $125.', src: [S.DECOY, S.DECOY2] },
        { text: "The test, run by researcher Dan Ariely with its subscription ad, appears in his 2008 book 'Predictably Irrational'.", src: [S.DECOY] }
      ],
      explain: "The Economist's print-only option, at the same $125 as print plus web, worked as a decoy that made the bundle look like a bargain. In Dan Ariely's classroom test, 84% chose the bundle with the decoy and 32% without it. Per 100 readers, that is $11,444 instead of $8,012.",
      explainSrc: [S.DECOY, S.DECOY2] },

    { id: 'planet-fitness', answer: 'Planet Fitness', world: 'Fitness', aliases: ['Planet', 'Black Card'],
      decoys: ['LA Fitness', '24 Hour Fitness', 'Anytime Fitness', 'Crunch Fitness', "Gold's Gym"],
      clues: [
        { text: 'On top of the monthly fee, it charges members a $49 annual fee.', src: [S.PLNT10K] },
        { text: 'It had about 20.8 million members at the end of 2025.', src: [S.PLNT10K] },
        { text: 'Its premium membership costs $24.99 a month.', src: [S.PLNT10K] },
        { text: 'In mid-2024 it raised its basic plan for new members from $10 to $15 a month, a 50% increase. Existing members stayed at $10.', src: [S.PLNTPR] }
      ],
      explain: 'Planet Fitness makes its money from many small, steady fees at large scale, with about 20.8 million members. There is the monthly charge, a $49 yearly fee and an upgrade to a $24.99 tier. Raising the basic plan from $10 to $15 for new members was a 50% increase that left existing members alone.',
      explainSrc: [S.PLNT10K, S.PLNTPR] },

    { id: 'ford', answer: 'Ford', world: 'Cars', aliases: [],
      decoys: ['General Motors', 'Toyota', 'Stellantis', 'Tesla', 'Honda'],
      clues: [
        { text: 'Its lending arm earned $2.6 billion before taxes in 2025, up 55%.', src: [S.FORD] },
        { text: 'That was close to the $3.0 billion its gas and hybrid vehicle business earned before interest and taxes.', src: [S.FORD] },
        { text: 'The company as a whole posted a net loss of $8.2 billion in 2025.', src: [S.FORD] }
      ],
      explain: 'Ford builds cars, but lending people the money to buy them earned almost as much as its gas and hybrid vehicle business. Its finance arm made $2.6 billion before taxes in 2025, up 55%. It came in a year when Ford as a whole lost $8.2 billion.',
      explainSrc: [S.FORD] },

    { id: 'microsoft', answer: 'Microsoft', world: 'Software', aliases: ['Xbox', 'Copilot', 'Windows', 'Outlook', 'Excel', 'PowerPoint'],
      decoys: ['Google', 'Apple', 'Sony', 'Adobe', 'Amazon'],
      clues: [
        { text: 'It raised the top tier of its game subscription 50% to $29.99 a month in October 2025, then cut it to $22.99 in April 2026.', src: [S.GP25, S.GP26] },
        { text: 'Its consumer office software subscription had 89 million subscribers in mid-2025.', src: [S.MSFT25] },
        { text: "In January 2025 it raised that subscription's personal plan from $69.99 to $99.99 a year, its first US price rise in 12 years, after adding its AI assistant.", src: [S.M365] }
      ],
      explain: 'Microsoft keeps turning software into a recurring bill. Its consumer office subscription reached 89 million subscribers, and adding an AI assistant came with a $30-a-year price rise. When a 50% rise on its game subscription went too far, it cut the price within seven months.',
      explainSrc: [S.MSFT25, S.M365, S.GP25, S.GP26C] },

    { id: 'jcpenney', answer: 'J.C. Penney', world: 'Retail', aliases: ['Penney', 'JCPenney', 'JCP'],
      decoys: ["Macy's", "Kohl's", 'Sears', 'Nordstrom', 'Target'],
      clues: [
        { text: 'In fiscal 2012 its sales fell 24.8% to $12.985 billion.', src: [S.JCP] },
        { text: "That year it had replaced sales and coupons with 'fair and square' everyday prices.", src: [S.JCPT, S.JCP] },
        { text: "Its CEO was ousted in April 2013, and the word 'sale' came back to its stores.", src: [S.JCPT] }
      ],
      explain: "J.C. Penney found out how much shoppers respond to a 'sale' sign. When it swapped sales and coupons for steady 'fair and square' prices, sales fell 24.8% in fiscal 2012. Within a year the CEO was out and the sales were back.",
      explainSrc: [S.JCP, S.JCPT] },

    { id: 'american', answer: 'American Airlines', world: 'Airlines', aliases: ['American', 'AAdvantage'],
      decoys: others(AIRLINES, 'American Airlines'),
      clues: [
        { text: 'A 2020 prospectus valued its frequent flyer program at $19.5 billion to $31.5 billion.', src: [S.AAVAL] },
        { text: 'In March 2021 it priced $10 billion of financing secured by that program.', src: [S.AA10B] },
        { text: 'Card and other partners paid it about $5.6 billion in cash in the 12 months to September 2024, a figure it expects to grow about 10% a year.', src: [S.AA8K] },
        { text: 'From January 2026, Citi became its exclusive co-brand credit card partner.', src: [S.AA8K] }
      ],
      explain: 'American Airlines sells miles to banks, which hand them out as card rewards. Card and other partners paid it about $5.6 billion in cash over 12 months, a sum it expects to grow about 10% a year. Lenders valued the program enough to put $10 billion of financing behind it in 2021.',
      explainSrc: [S.AA8K, S.AA10B] },

    { id: 'stubhub', answer: 'StubHub', world: 'Tickets', aliases: [],
      decoys: ['Ticketmaster', 'SeatGeek', 'Vivid Seats', 'Eventbrite', 'Live Nation'],
      clues: [
        { text: 'Starting in fall 2015, it randomly showed half of its US users the fees only at checkout.', src: [S.STUBH, S.STUBY] },
        { text: 'Users who saw the fees only at checkout spent about 21% more on tickets.', src: [S.STUBH] },
        { text: 'They were also 14% more likely to complete a purchase. Since May 2025, an FTC rule requires live-event ticket sellers to show the total price up front.', src: [S.STUBH, S.FTCFEE] }
      ],
      explain: 'StubHub tested what happens when fees appear only at the last step. Buyers who saw the full price late spent about 21% more and were 14% more likely to buy. Since May 2025, an FTC rule requires live-event ticket sellers to show the total price, including mandatory fees, up front.',
      explainSrc: [S.STUBH, S.STUBY, S.FTCFEE] },

    { id: 'disney', answer: 'Disney', world: 'Streaming', aliases: ['Hulu', 'Mickey'],
      decoys: ['Netflix', 'Warner Bros. Discovery', 'Paramount', 'Comcast', 'Apple'],
      clues: [
        { text: 'Had its streaming price only kept up with inflation since launch, it would be about $9.16 a month. Its ad-free plan is $21.49.', src: [S.CPI, S.DIS26] },
        { text: 'In September 2026 it announced a rise for its ad-free streaming plan from $18.99 to $21.49.', src: [S.DIS26] },
        { text: 'Its main streaming service launched at $6.99 a month on November 12, 2019.', src: [S.DIS19] }
      ],
      explain: 'Disney launched its streaming service cheap and has raised the price step by step. The ad-free plan went from $6.99 in 2019 to $21.49 in 2026, a 207% rise, while inflation alone would have taken it to about $9.16. A $12.49 plan with ads keeps a cheaper option open.',
      explainSrc: [S.DIS19, S.DIS26, S.CPI] },

    { id: 'bmw', answer: 'BMW', world: 'Cars', aliases: [],
      decoys: ['Mercedes-Benz', 'Audi', 'Porsche', 'Tesla', 'Volvo'],
      clues: [
        { text: 'In the UK, Germany, New Zealand, South Africa and South Korea, it charged about $18 a month to switch on heated seats already built into the car.', src: [S.BMW] },
        { text: 'In September 2023 it said it would drop that fee, because uptake was low and buyers felt they paid twice. Paid features such as driving and parking assistance stayed.', src: [S.BMW] }
      ],
      explain: 'BMW tried charging monthly for hardware already in the car: about $18 a month for heated seats in several countries. Buyers felt they were paying twice and uptake was low, so it dropped the seat fee in 2023. It kept selling other features on demand, such as driving and parking assistance.',
      explainSrc: [S.BMW] },

    { id: 'williams-sonoma', answer: 'Williams-Sonoma', world: 'Retail', aliases: ['Williams', 'Sonoma'],
      decoys: ['Crate & Barrel', 'Sur La Table', 'Bed Bath & Beyond', "Macy's", 'Target'],
      clues: [
        { text: 'This kitchen retailer once sold a single bread-baking machine, priced at $275.', src: [S.WSM] },
        { text: 'It added a larger model at $429. Few people bought it, but sales of the $275 machine almost doubled, according to a 1992 research paper.', src: [S.WSM] }
      ],
      explain: "Williams-Sonoma's $429 bread maker sold poorly, but it made the $275 machine look like the sensible choice, and sales of the cheaper one almost doubled. Researchers Itamar Simonson and Amos Tversky described it in 1992: the option sitting next to a product can change what people buy.",
      explainSrc: [S.WSM] },

    { id: 'toyota', answer: 'Toyota', world: 'Cars', aliases: ['Lexus', 'Remote Connect'],
      decoys: ['Honda', 'Ford', 'Hyundai', 'Nissan', 'Subaru'],
      clues: [
        { text: 'On certain models, starting the car remotely with the key fob requires a paid connected-services plan once the free trial ends.', src: [S.TOYM, S.TOY] },
        { text: "That plan costs $8 a month and also works through the carmaker's phone app.", src: [S.TOY] }
      ],
      explain: 'Toyota sells remote start on certain models as an $8-a-month connected service once the trial ends, even when you use the key fob. Carmakers including BMW, Mercedes-Benz and Tesla have tried similar monthly fees for features.',
      explainSrc: [S.TOY, S.TOYM, S.BMW, S.MBZ, S.TSLA1] }
  ];

  var DATA = { start: '2026-10-26', puzzles: PUZZLES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.MMD_DATA = DATA;
})(this);
