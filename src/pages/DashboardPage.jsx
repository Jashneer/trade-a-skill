// src/pages/DashboardPage.jsx (FINAL STABLE VERSION with Merged User Listings)
import * as React from 'react'; 
import { useState, useEffect, useMemo } from 'react'; 
import SkillCard from '../components/SkillCard'; 
import { useAuth } from '../context/AuthContext'; 


// --- Helper Function to Load and Transform User Skills ---
// loadAllSkills will fetch from the JSON Server and merge static skills + user-submitted skills
const loadAllSkills = async () => {
    try {
        // 1. GET static skills
        const skillsRes = await fetch('http://localhost:3000/skills');
        if (!skillsRes.ok) throw new Error('Failed to load skills');
        const staticSkills = await skillsRes.json();

        // 2. GET users
        const usersRes = await fetch('http://localhost:3000/users');
        if (!usersRes.ok) throw new Error('Failed to load users');
        const users = await usersRes.json();

        // 3. GET swapReviews
        const reviewsRes = await fetch('http://localhost:3000/swapReviews');
        const allReviews = reviewsRes.ok ? await reviewsRes.json() : [];

        const allSkills = Array.isArray(staticSkills) ? [...staticSkills] : [];

        // helper: assign category based on skill keywords
        const assignCategory = (skillName) => {
            if (!skillName) return 'user';
            const s = String(skillName).toLowerCase();
            if (/\b(python|javascript|java|c#|c\+\+|react|node|html|css|web|program|sql|excel)\b/.test(s)) return 'technology';
            if (/\b(guitar|piano|sing|singing|painting|drawing|art|photography|dance)\b/.test(s)) return 'arts';
            if (/\b(spanish|french|german|english|mandarin|japanese)\b/.test(s)) return 'language';
            if (/\b(marketing|business|finance|sales|accounting|management)\b/.test(s)) return 'business';
            return 'user';
        };

        users.forEach(user => {
            const userReviews = (allReviews || []).filter(r => r.teacherId === user.email || r.teacherName === user.email || r.teacherName === `${user.firstName} ${user.lastName}`);
            const tradesWithReviews = userReviews.length;

            let currentRating = 0;
            if (tradesWithReviews > 0) {
                const sum = userReviews.reduce((acc, review) => acc + (Number(review.rating) || 0), 0);
                currentRating = (sum / tradesWithReviews).toFixed(1);
            }

            const displayRating = tradesWithReviews >= 3 ? currentRating : 'N/A';
            const displayLevel = tradesWithReviews >= 5 ? 'advanced' : (tradesWithReviews >= 1 ? 'intermediate' : 'beginner');

            if (user.skillsToTeach && user.skillsToTeach.length > 0) {
                user.skillsToTeach.forEach((skillName, index) => {
                    const normalizedTitle = String(skillName).trim();
                    const listing = {
                        id: `${user.email}-${index}`,
                        title: normalizedTitle,
                        description: user.bio || `Skill offered by ${user.firstName}`,
                        category: assignCategory(normalizedTitle),
                        level: displayLevel,
                        duration: 'Flexible',
                        teacher: {
                            name: `${user.firstName} ${user.lastName}`,
                            rating: displayRating,
                            completedTrades: tradesWithReviews
                        }
                    };
                    allSkills.push(listing);
                });
            }
        });

        return allSkills;
    } catch (err) {
        console.error('loadAllSkills error', err);
        return [];
    }
};

const DashboardPage = () => {
    const { user, isLoggedIn } = useAuth(); 
    
    // State Declarations
    const [allSkills, setAllSkills] = useState([]); // Holds all data (Source)
    const [filteredSkills, setFilteredSkills] = useState([]); // Rendered list
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('');
    const [sort, setSort] = useState('title-asc');
    const [currentView, setCurrentView] = useState('grid'); 

    // Utility Functions 
    const parseLessonCount = (d) => parseInt(d.split(' ')[0]) || 0;

    const sortSkills = (skills, sortCriterion) => {
        const [sortBy, sortOrder] = sortCriterion.split('-');
        return skills.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'title') {
                comparison = a.title.localeCompare(b.title);
            } else if (sortBy === 'rating') {
                // Handle 'N/A' ratings during sort: place N/A items lower
                const ratingA = a.teacher.rating === 'N/A' ? -1 : parseFloat(a.teacher.rating);
                const ratingB = b.teacher.rating === 'N/A' ? -1 : parseFloat(b.teacher.rating);
                comparison = ratingA - ratingB;
            } else if (sortBy === 'duration') {
                comparison = parseLessonCount(a.duration) - parseLessonCount(b.duration);
            }
            return sortOrder === 'desc' ? comparison * -1 : comparison;
        });
    };

    // Matchmaking Logic (uses merged data and user profile)
    const matchmakingSuggestions = useMemo(() => {
        if (!isLoggedIn || !user.skillsToLearn || user.skillsToLearn.length === 0) {
            return [];
        }

        const skillsNeeded = (user.skillsToLearn || []).map(s => String(s).toLowerCase());
        const myTeach = (user.skillsToTeach || []).map(s => String(s).toLowerCase());

        // Read all users from localStorage to check reciprocity
        const allUsers = JSON.parse(localStorage.getItem('tradeASkillUsers') || '[]');

        return allSkills.filter(skill => {
            const title = String(skill.title || '').toLowerCase();

            // Primary filter: skill title must be something the current user wants to learn
            if (!skillsNeeded.includes(title)) return false;

            // Find teacher profile from localStorage (match by email or full name)
            const teacherIdentifier = (skill.teacher && (skill.teacher.email || skill.teacher.name)) || '';
            const teacherProfile = allUsers.find(u => {
                if (!u) return false;
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().trim();
                const uEmail = (u.email || '').toLowerCase();
                const id = String(teacherIdentifier || '').toLowerCase();
                return uEmail === id || fullName === id;
            });

            // If we can't find the teacher profile, skip
            if (!teacherProfile) return false;

            // Reciprocity check: teacher must want to learn something current user can teach
            const teacherWants = (teacherProfile.skillsToLearn || []).map(s => String(s).toLowerCase());
            const reciprocity = teacherWants.some(t => myTeach.includes(t));

            return reciprocity;
        });
    }, [isLoggedIn, user.skillsToLearn, user.skillsToTeach, allSkills]);


    // Load skills from API when component mounts
    useEffect(() => {
        let mounted = true;
        (async () => {
            const loaded = await loadAllSkills();
            if (mounted) setAllSkills(loaded);
        })();
        return () => { mounted = false; };
    }, []);

    // Filtering and Sorting Effect (Runs when filters or data change)
    useEffect(() => {
        let tempFilteredSkills = allSkills.filter(skill => {
            const lowerSearchTerm = searchTerm.toLowerCase().trim();
            
            // Search criteria check (case-insensitive)
            const title = String(skill.title || '').toLowerCase();
            const desc = String(skill.description || '').toLowerCase();
            const teacherName = String((skill.teacher && skill.teacher.name) || '').toLowerCase();

            const matchesSearch = lowerSearchTerm === '' ||
                title.includes(lowerSearchTerm) ||
                desc.includes(lowerSearchTerm) ||
                teacherName.includes(lowerSearchTerm);

            // Filter criteria check (case-insensitive)
            const matchesCategory = category === '' || String(skill.category || '').toLowerCase() === String(category || '').toLowerCase();
            const matchesLevel = level === '' || String(skill.level || '').toLowerCase() === String(level || '').toLowerCase();

            return matchesSearch && matchesCategory && matchesLevel;
        });

        const sortedSkills = sortSkills(tempFilteredSkills, sort);
        setFilteredSkills(sortedSkills);
    }, [searchTerm, category, level, sort, allSkills]);


    return (
        <main>
            <div className="container">
                {/* 1. MATCHMAKING SECTION (Visible when logged in and skills are listed) */}
                {matchmakingSuggestions.length > 0 && (
                    <section className="matchmaking-section" style={{ padding: '20px 0', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '24px', color: 'var(--primary-color)' }}>
                            🎯 Top Matches for You!
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Based on your profile, we found teachers for skills you want to learn.</p>
                        <div className="skills-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '15px' }}>
                            {matchmakingSuggestions.slice(0, 3).map(skill => (
                                <SkillCard key={`match-${skill.id}`} skill={skill} currentView="grid" />
                            ))}
                        </div>
                    </section>
                )}
                
                <section className="controls-section">
                    {/* Search Form */}
                    <form className="search-form" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="text" id="skillSearch" name="search"
                            placeholder="Search skills, teachers, or descriptions..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>

                    <div className="filters-and-sort">
                         {/* Category Filter */}
                        <select id="categoryFilter" className="filter-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="">All Categories</option>
                            <option value="technology">Technology</option>
                            <option value="language">Language</option>
                            <option value="arts">Arts</option>
                            <option value="business">Business</option>
                            <option value="user">User Submissions</option> 
                        </select>

                        {/* Level Filter */}
                        <select id="levelFilter" className="filter-control" value={level} onChange={(e) => setLevel(e.target.value)}>
                            <option value="">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="flexible">Flexible</option> 
                        </select>

                        {/* Sort Control */}
                        <select id="sortControl" className="filter-control" value={sort} onChange={(e) => setSort(e.target.value)}>
                            <option value="title-asc">Sort By: A-Z Title</option>
                            <option value="title-desc">Sort By: Z-A Title</option>
                            <option value="rating-desc">Sort By: Highest Rating</option>
                            <option value="duration-asc">Sort By: Shortest Duration</option>
                        </select>
                        
                        {/* View Toggles */}
                        <div className="view-toggles">
                            <button
                                id="gridView" className={currentView === 'grid' ? 'active' : ''}
                                title="Grid View" onClick={() => setCurrentView('grid')}
                            >
                                <i className="fas fa-th-large"></i> Grid
                            </button>
                            <button
                                id="listView" className={currentView === 'list' ? 'active' : ''}
                                title="List View" onClick={() => setCurrentView('list')}
                            >
                                <i className="fas fa-list"></i> List
                            </button>
                        </div>
                    </div>
                </section>

                {/* 2. MAIN SKILLS CONTAINER (Renders the filtered list) */}
                {filteredSkills.length > 0 ? (
                    <section id="skillsContainer" className={currentView === 'grid' ? 'skills-grid' : 'skills-list'}>
                        {filteredSkills.map(skill => (
                            <SkillCard key={skill.id} skill={skill} currentView={currentView} />
                        ))}
                    </section>
                ) : (
                    <div id="noResultsMessage" className="no-results-message">
                         <p>😔 No skills matched your current filters. Try adjusting your search or filters!</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default DashboardPage;