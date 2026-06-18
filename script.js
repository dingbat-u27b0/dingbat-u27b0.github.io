document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // 2. Scroll to Top Functionality
    const scrollToTopBtn = document.getElementById('scrollToTop');

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const themeToggle = document.getElementById('theme-toggle');
    const iconBulb = document.getElementById('icon-bulb');
    const iconMoon = document.getElementById('icon-moon');
    const body = document.body;

    // Optional but recommended: Check if the user previously chose light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        iconBulb.classList.remove('active');
        iconMoon.classList.add('active');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault(); // Prevents the page from jumping to the top
            body.classList.toggle('light-theme');
            
            // Swap icons and save preference
            if (body.classList.contains('light-theme')) {
                iconBulb.classList.remove('active');
                iconMoon.classList.add('active');
                localStorage.setItem('theme', 'light');
            } else {
                iconMoon.classList.remove('active');
                iconBulb.classList.add('active');
                localStorage.setItem('theme', 'dark'); // Dark is default
            }
        });
    }
});

// --- Automated Archive Generator ---
async function loadArchive(indexUrl, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // 1. Fetch the JSON index
        const response = await fetch(indexUrl);
        if (!response.ok) throw new Error("Index not found");
        let posts = await response.json();

        // 2. Sort posts globally in reverse chronological order
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        const postsByYear = {};

        // 3. Fetch each markdown file to calculate dynamic stats
        await Promise.all(posts.map(async (post) => {
            try {
                const mdResponse = await fetch(post.file);
                const mdText = await mdResponse.text();
                
                // Calculate word count and read time (avg 200 words per minute)
                const wordCount = mdText.trim().split(/\s+/).length;
                post.wordCount = wordCount;
                post.readTime = Math.max(1, Math.ceil(wordCount / 200));
            } catch (e) {
                post.wordCount = 0;
                post.readTime = 1;
            }

            // Group by Year
            const year = new Date(post.date).getFullYear();
            if (!postsByYear[year]) postsByYear[year] = [];
            postsByYear[year].push(post);
        }));

        // 4. Generate the HTML structure
        let html = '';
        const years = Object.keys(postsByYear).sort((a, b) => b - a); // Sort years descending

        years.forEach(year => {
            html += `<section class="year-group"><h2 class="year-heading">${year}</h2>`;
            
            // Sort posts within the year
            postsByYear[year].sort((a, b) => new Date(b.date) - new Date(a.date));

            postsByYear[year].forEach(post => {
                // Format Date to "12 April 2026"
                const dateObj = new Date(post.date);
                const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

                html += `
                <article class="post">
                    <div class="post-thumbnail">
                        <img src="${post.thumb_dark || ''}" class="thumb-dark" alt="">
                        <img src="${post.thumb_light || ''}" class="thumb-light" alt="">
                    </div>
                    <div class="post-content">
                        <a href="article.html?file=${post.file}" style="text-decoration: none; color: inherit;">
                            <h3>${post.title}</h3>
                        </a>
                        <div class="meta">
                            <span>${formattedDate}</span> <span class="dot-separator">•</span>
                            <span>${post.wordCount} words</span> <span class="dot-separator">•</span>
                            <span>${post.readTime} mins</span>
                        </div>
                    </div>
                </article>`;
            });
            html += `</section>`;
        });

        // 5. Inject into the page
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `<p>Error loading archive: ${error.message}</p>`;
    }
}

// --- Homepage Mixed Post Generator (Recent + Random) ---
async function loadHomepagePosts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Define all the folders you want to pull from and their display names
    const sources = [
        { url: 'blog/index.json', name: 'Blog' },
        { url: 'writing/index.json', name: 'Writing' },
        { url: 'notes/index.json', name: 'Notes' },
        { url: 'resources/guides-tutorials/index.json', name: 'Guide' },
        { url: 'resources/book-reviews/index.json', name: 'Book Review' },
        { url: 'resources/quotes-excerpts/index.json', name: 'Excerpt' },
        { url: 'resources/useful-software/index.json', name: 'Software' },
        { url: 'resources/useful-wikis/index.json', name: 'Wiki' }
    ];

    let allPosts = [];

    // 1. Fetch all index.json files concurrently
    await Promise.all(sources.map(async (source) => {
        try {
            const response = await fetch(source.url);
            if (response.ok) {
                const posts = await response.json();
                // Add the category name to each post
                posts.forEach(p => {
                    p.category = source.name;
                    allPosts.push(p);
                });
            }
        } catch (e) {
            // Fails silently if a folder doesn't have an index.json yet
        }
    }));

    if (allPosts.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No posts found yet.</p>';
        return;
    }

    // 2. Sort all posts by date (Newest first)
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. Pick the 2 newest posts, and 2 random older posts to "feature"
    let selectedPosts = allPosts.slice(0, 2);
    let remainingPosts = allPosts.slice(2);
    
    if (remainingPosts.length > 0) {
        // Shuffle the remaining older posts
        remainingPosts.sort(() => 0.5 - Math.random());
        // Add 2 random ones to the selection
        selectedPosts = selectedPosts.concat(remainingPosts.slice(0, 2));
    }

    // 4. Fetch the Markdown content ONLY for the selected posts to calculate read times
    await Promise.all(selectedPosts.map(async (post) => {
        try {
            const mdResponse = await fetch(post.file);
            const mdText = await mdResponse.text();
            const wordCount = mdText.trim().split(/\s+/).length;
            post.wordCount = wordCount;
            post.readTime = Math.max(1, Math.ceil(wordCount / 200));
        } catch (e) {
            post.wordCount = 0;
            post.readTime = 1;
        }
    }));

    // 5. Generate HTML with the new Category Tag
    let html = '';
    selectedPosts.forEach(post => {
        const dateObj = new Date(post.date);
        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        html += `
        <article class="post">
            <div class="post-thumbnail">
                <img src="${post.thumb_dark || ''}" class="thumb-dark" alt="">
                <img src="${post.thumb_light || ''}" class="thumb-light" alt="">
            </div>
            <div class="post-content">
                <span class="category-tag">${post.category}</span>
                <a href="article.html?file=${post.file}" style="text-decoration: none; color: inherit;">
                    <h3>${post.title}</h3>
                </a>
                <div class="meta">
                    <span>${formattedDate}</span> <span class="dot-separator">•</span>
                    <span>${post.wordCount} words</span> <span class="dot-separator">•</span>
                    <span>${post.readTime} mins</span>
                </div>
            </div>
        </article>`;
    });

    // 6. Inject into the page
    container.innerHTML = html;
}









