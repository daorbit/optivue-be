import axios from "axios";
import * as cheerio from "cheerio";

class SeoService {
  async analyzeUrl(url) {
    try {
      if (!url || !url.startsWith("http")) {
        throw new Error("Invalid URL provided");
      }

      const results = {
        url: url,
        meta: {},
        performance: {},
        technical: {},
        content: {},
      };
      

      const pageData = await this.getPageData(url);
      results.meta = pageData.meta;
      results.content = pageData.content;

      const performanceData = await this.getPageSpeedInsights(url);
      results.performance = performanceData;

      results.technical = await this.getTechnicalSeoData(url);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error("SEO analysis error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPageData(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      const meta = this.extractAllMetaTags($);
      const schemas = this.extractAllSchemas($);
      const images = this.extractAllImages($, url);

      const content = {
        h1Count: $("h1").length,
        h2Count: $("h2").length,
        h3Count: $("h3").length,
        imgCount: $("img").length,
        linkCount: $("a").length,
        wordCount: $("body")
          .text()
          .split(/\s+/)
          .filter((word) => word.length > 0).length,
        hasSchema: $('script[type="application/ld+json"]').length > 0,
        schemaTypes: this.extractSchemaTypes($),
        schemas: schemas,
        images: images,
        internalLinks: this.countInternalLinks($, url),
        externalLinks: this.countExternalLinks($, url),
        headingStructure: this.analyzeHeadingStructure($),
        keywordDensity: this.calculateKeywordDensity($),
        readabilityScore: this.calculateReadabilityScore($),
        contentQuality: this.analyzeContentQuality($),
      };

      return { meta, content };
    } catch (error) {
      throw new Error(`Failed to fetch page data: ${error.message}`);
    }
  }

  
  async getPageSpeedInsights(url) {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (!apiKey) {
      return {
        note: "Google PageSpeed API key not configured",
        scores: {},
        suggestions: [],
      };
    }

    const strategies = ["mobile", "desktop"];
    const categories = [
      "performance",
      "accessibility",
      "best-practices",
      "seo",
    ];

    const requests = strategies.map((strategy) =>
      axios.get(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
          url
        )}&strategy=${strategy}&${categories
          .map((c) => `category=${c}`)
          .join("&")}&key=${apiKey}`
      )
    );

    const responses = await Promise.all(requests);

    // Reusable helper to make human-readable suggestions
    const getReadableAdvice = (id, audit) => {
      const title = audit.title || "";
      const desc = audit.description || "";

      // Some handcrafted advice for common audits
      const adviceMap = {
        "uses-webp-images":
          "Convert your images to WebP or AVIF format to reduce image size and improve load time.",
        "uses-text-compression":
          "Enable GZIP or Brotli compression on your server for text-based resources (HTML, CSS, JS).",
        "render-blocking-resources":
          "Defer non-critical CSS/JS or load them asynchronously to speed up first render.",
        "unused-css-rules":
          "Remove or split large CSS files. Only load the CSS needed for the above-the-fold content.",
        "unused-javascript":
          "Remove unused JS or lazy-load scripts used after interaction.",
        "server-response-time":
          "Optimize backend performance, caching, and database queries to reduce server response time.",
        "uses-rel-preload":
          "Preload key requests (like fonts or hero images) to prioritize critical assets.",
        "uses-long-cache-ttl":
          "Set longer cache lifetimes for static assets (at least 1 year).",
        "meta-description":
          "Add a relevant meta description tag for better search visibility.",
        "viewport":
          "Add a `<meta name='viewport'>` tag to improve mobile responsiveness.",
        "is-crawlable":
          "Ensure your robots.txt and meta tags allow search engines to crawl this page.",
      };

      const baseAdvice = adviceMap[id] || desc || title;

      // Add estimated savings if available
      const extra = [];
      if (audit.details?.overallSavingsMs)
        extra.push(
          `Can save approximately ${Math.round(
            audit.details.overallSavingsMs
          )} ms of load time.`
        );
      if (audit.details?.overallSavingsBytes)
        extra.push(
          `Reduce total size by ~${Math.round(
            audit.details.overallSavingsBytes / 1024
          )} KB.`
        );

      return `${baseAdvice}${extra.length ? " " + extra.join(" ") : ""}`;
    };

    const results = responses.map((res, i) => {
      const lighthouse = res.data.lighthouseResult || {};
      const audits = lighthouse.audits || {};
      const cats = lighthouse.categories || {};

      const getScore = (cat) =>
        cat?.score != null ? Math.round(cat.score * 100) : null;

      const scores = {
        performance: getScore(cats.performance),
        accessibility: getScore(cats.accessibility),
        bestPractices: getScore(cats["best-practices"]),
        seo: getScore(cats.seo),
      };

      const extractMetric = (metric) =>
        metric?.numericValue != null ? Math.round(metric.numericValue) : null;

      const suggestions = Object.entries(audits)
        .filter(
          ([, audit]) =>
            audit.score != null &&
            audit.score < 0.9 &&
            (audit.description || audit.details)
        )
        .map(([id, audit]) => {
          const fixHints = [];

          if (audit.details?.items?.length) {
            audit.details.items.slice(0, 3).forEach((item) => {
              if (item.url) fixHints.push(`Resource: ${item.url}`);
              if (item.wastedBytes)
                fixHints.push(
                  `Reduce by ${Math.round(item.wastedBytes / 1024)} KB`
                );
              if (item.wastedMs)
                fixHints.push(`Potential savings: ${Math.round(item.wastedMs)} ms`);
            });
          }

          return {
            id,
            title: audit.title,
            category:
              Object.keys(cats).find((c) =>
                cats[c]?.auditRefs?.some((ref) => ref.id === id)
              ) || "general",
            score: Math.round(audit.score * 100),
            displayValue: audit.displayValue || null,
            description: audit.description,
            fixSuggestions: fixHints,
            humanReadableAdvice: getReadableAdvice(id, audit),
          };
        });

      return {
        strategy: strategies[i],
        scores,
        metrics: {
          firstContentfulPaint: extractMetric(audits["first-contentful-paint"]),
          speedIndex: extractMetric(audits["speed-index"]),
          largestContentfulPaint: extractMetric(
            audits["largest-contentful-paint"]
          ),
          interactive: extractMetric(audits["interactive"]),
          totalBlockingTime: extractMetric(audits["total-blocking-time"]),
          cumulativeLayoutShift:
            audits["cumulative-layout-shift"]?.displayValue ?? null,
        },
        suggestions,
      };
    });

    const desktopResult = results.find((r) => r.strategy === "desktop") || null;
    const mobileResult = results.find((r) => r.strategy === "mobile") || null;

    const aggregatedScores = {
      performance:
        desktopResult?.scores?.performance ??
        mobileResult?.scores?.performance ??
        null,
      accessibility:
        desktopResult?.scores?.accessibility ??
        mobileResult?.scores?.accessibility ??
        null,
      bestPractices:
        desktopResult?.scores?.bestPractices ??
        mobileResult?.scores?.bestPractices ??
        null,
      seo: desktopResult?.scores?.seo ?? mobileResult?.scores?.seo ?? null,
    };

    const allSuggestions = [
      ...(desktopResult?.suggestions || []),
      ...(mobileResult?.suggestions || []),
    ];

    const uniqueSuggestions = allSuggestions.filter(
      (s, index, arr) => arr.findIndex((t) => t.id === s.id) === index
    );

    uniqueSuggestions.sort((a, b) => a.score - b.score);

    return {
      url,
      desktop: desktopResult,
      mobile: mobileResult,
      scores: aggregatedScores,
      suggestions: uniqueSuggestions,
    };
  } catch (error) {
    console.error(
      "PageSpeed Insights error:",
      error?.response?.data || error.message
    );
    return {
      error: "Failed to fetch PageSpeed data",
      scores: {},
      suggestions: [],
    };
  }
}


  extractMetric(audit) {
    if (!audit) return null;
    return {
      title: audit.title,
      displayValue: audit.displayValue || "N/A",
      score:
        audit.score !== null && audit.score !== undefined
          ? Math.round(audit.score * 100)
          : null,
    };
  }

  extractSchemaTypes($) {
    const schemas = [];
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const schemaData = JSON.parse($(elem).html());
        if (schemaData["@type"]) {
          schemas.push(schemaData["@type"]);
        } else if (schemaData["@graph"]) {
          // Handle schema.org graph format
          schemaData["@graph"].forEach((item) => {
            if (item["@type"]) {
              schemas.push(item["@type"]);
            }
          });
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });
    return [...new Set(schemas)]; // Remove duplicates
  }

  countInternalLinks($, baseUrl) {
    const baseDomain = new URL(baseUrl).hostname;
    let count = 0;
    $("a[href]").each((i, elem) => {
      const href = $(elem).attr("href");
      if (
        href &&
        !href.startsWith("http") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:")
      ) {
        count++;
      } else if (href && href.includes(baseDomain)) {
        count++;
      }
    });
    return count;
  }

  countExternalLinks($, baseUrl) {
    const baseDomain = new URL(baseUrl).hostname;
    let count = 0;
    $("a[href]").each((i, elem) => {
      const href = $(elem).attr("href");
      if (href && href.startsWith("http") && !href.includes(baseDomain)) {
        count++;
      }
    });
    return count;
  }

  analyzeHeadingStructure($) {
    const headings = [];
    for (let i = 1; i <= 6; i++) {
      const count = $(`h${i}`).length;
      if (count > 0) {
        headings.push({
          level: i,
          count,
          texts: $(`h${i}`)
            .map((i, el) => $(el).text().trim())
            .get(),
        });
      }
    }
    return headings;
  }

  async getTechnicalSeoData(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      return {
        statusCode: response.status,
        contentType: response.headers["content-type"] || "",
        contentLength: response.headers["content-length"] || "",
        server: response.headers["server"] || "",
        hasHttps: url.startsWith("https"),
        hasMobileViewport: $('meta[name="viewport"]').length > 0,
        hasFavicon: $('link[rel="icon"], link[rel="shortcut icon"]').length > 0,
        hasOpenGraph: $('meta[property^="og:"]').length > 0,
        hasTwitterCards: $('meta[name^="twitter:"]').length > 0,
        hasStructuredData: $('script[type="application/ld+json"]').length > 0,
        imageAltCount: $("img[alt]").length,
        totalImages: $("img").length,
        missingAltImages: $("img:not([alt])").length,
      };
    } catch (error) {
      throw new Error(`Failed to get technical data: ${error.message}`);
    }
  }

  extractAllMetaTags($) {
    const metaTags = {
      title: $("title").text().trim(),
      // Standard meta tags
      description: $('meta[name="description"]').attr("content") || "",
      keywords: $('meta[name="keywords"]').attr("content") || "",
      author: $('meta[name="author"]').attr("content") || "",
      robots: $('meta[name="robots"]').attr("content") || "",
      viewport: $('meta[name="viewport"]').attr("content") || "",
      charset: $("meta[charset]").attr("charset") || "",
      // Open Graph tags
      ogTitle: $('meta[property="og:title"]').attr("content") || "",
      ogDescription: $('meta[property="og:description"]').attr("content") || "",
      ogImage: $('meta[property="og:image"]').attr("content") || "",
      ogUrl: $('meta[property="og:url"]').attr("content") || "",
      ogType: $('meta[property="og:type"]').attr("content") || "",
      ogSiteName: $('meta[property="og:site_name"]').attr("content") || "",
      // Twitter Card tags
      twitterTitle: $('meta[name="twitter:title"]').attr("content") || "",
      twitterDescription:
        $('meta[name="twitter:description"]').attr("content") || "",
      twitterImage: $('meta[name="twitter:image"]').attr("content") || "",
      twitterCard: $('meta[name="twitter:card"]').attr("content") || "",
      twitterSite: $('meta[name="twitter:site"]').attr("content") || "",
      // Link tags
      canonical: $('link[rel="canonical"]').attr("href") || "",
      favicon:
        $('link[rel="icon"], link[rel="shortcut icon"]').attr("href") || "",
      // All other meta tags
      allMetaTags: [],
    };

    // Extract all meta tags
    $("meta").each((i, elem) => {
      const tag = $(elem);
      const name =
        tag.attr("name") || tag.attr("property") || tag.attr("http-equiv");
      const content = tag.attr("content");
      if (name && content) {
        metaTags.allMetaTags.push({ name, content });
      }
    });

    return metaTags;
  }

  extractAllSchemas($) {
    const schemas = [];
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const schemaData = JSON.parse($(elem).html());
        schemas.push(schemaData);
      } catch (e) {
        // Invalid JSON, skip
        console.warn("Invalid JSON-LD schema found:", e.message);
      }
    });
    return schemas;
  }

  extractAllImages($, baseUrl) {
    const images = [];
    $("img").each((i, elem) => {
      const img = $(elem);
      const src = img.attr("src");
      const alt = img.attr("alt") || "";
      const title = img.attr("title") || "";
      const width = img.attr("width");
      const height = img.attr("height");
      const loading = img.attr("loading") || "";
      const decoding = img.attr("decoding") || "";

      if (src) {
        // Resolve relative URLs
        let absoluteSrc = src;
        if (!src.startsWith("http")) {
          try {
            absoluteSrc = new URL(src, baseUrl).href;
          } catch (e) {
            // Keep original if URL resolution fails
          }
        }

        images.push({
          src: absoluteSrc,
          alt,
          title,
          width: width ? parseInt(width) : null,
          height: height ? parseInt(height) : null,
          loading,
          decoding,
          hasAlt: !!alt,
        });
      }
    });
    return images;
  }

  calculateKeywordDensity($) {
    // Simple keyword density calculation
    const text = $("body").text().toLowerCase();
    const words = text.split(/\s+/).filter((word) => word.length > 3);
    const wordCount = words.length;

    if (wordCount === 0) return {};

    const wordFreq = {};
    words.forEach((word) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Get top 10 keywords
    const sortedWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / wordCount) * 100).toFixed(2) + "%",
      }));

    return sortedWords;
  }

  calculateReadabilityScore($) {
    // Simple readability score based on sentence and word count
    const text = $("body").text();
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((word) => word.length > 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord =
      words.reduce((sum, word) => sum + this.countSyllables(word), 0) /
      words.length;

    // Simplified Flesch Reading Ease formula
    const score =
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, score));
  }

  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = "aeiouy";
    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    if (word.endsWith("e")) syllableCount--;
    return Math.max(1, syllableCount);
  }

  analyzeContentQuality($) {
    const text = $("body").text();
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    let score = 0;

    // Word count score
    if (wordCount > 300) score += 30;
    else if (wordCount > 150) score += 20;
    else if (wordCount > 50) score += 10;

    // Sentence variety
    if (sentences.length > 5) score += 20;

    // Has headings
    if ($("h1, h2, h3").length > 0) score += 20;

    // Has images with alt text
    const imagesWithAlt = $("img[alt]").length;
    const totalImages = $("img").length;
    if (totalImages > 0 && imagesWithAlt / totalImages > 0.5) score += 15;

    // Has links
    if ($("a").length > 3) score += 15;

    return Math.min(100, score);
  }
}

export default new SeoService();
