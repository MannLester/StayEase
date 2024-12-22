import React, { useState, useEffect } from 'react';
import './HomePage.css';
import ItemsContext from './ItemsContext.jsx';
import { FilterMenu } from './FilterMenu.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { auth } from '../../firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import logoSvg from '../../assets/STAY.svg';

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    priceRange: { min: 0, max: 50000 },
    selectedTags: [],
    selectedLocation: '',
    selectedPropertyType: ''
  });
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [user, setUser] = useState(null);
  const [userFavorites, setUserFavorites] = useState([]);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [sortOption, setSortOption] = useState('popular');

  // Set up real-time listener for properties
  useEffect(() => {
    console.log('Setting up real-time listener for properties...');
    const propertiesCollection = collection(db, 'properties');
    
    setIsLoading(true); // Set loading to true when starting fetch
    
    const unsubscribe = onSnapshot(propertiesCollection, (snapshot) => {
      console.log('Received database update:', snapshot.size, 'properties');
      const propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Updated properties data:', propertiesData);
      
      setProperties(propertiesData);
      setFilteredProperties(propertiesData);
      setIsLoading(false); // Set loading to false when data is received
    }, (error) => {
      console.error('Error in real-time listener:', error);
      setIsLoading(false); // Set loading to false on error
    });

    // Cleanup listener on component unmount
    return () => {
      console.log('Cleaning up real-time listener...');
      unsubscribe();
    };
  }, []); // Empty dependency array means this only runs once on mount

  // Set up auth listener and fetch user favorites
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const accountDoc = await getDoc(doc(db, 'accounts', user.uid));
        if (accountDoc.exists()) {
          setUserFavorites(accountDoc.data().itemsSaved || []);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Filter properties based on search and filters
  useEffect(() => {
    let filtered = [...properties];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.propertyLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        property.propertyType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.owner.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price range filter
    filtered = filtered.filter(property =>
      property.rent >= activeFilters.priceRange.min &&
      property.rent <= activeFilters.priceRange.max
    );

    // Apply location filter
    if (activeFilters.selectedLocation) {
      filtered = filtered.filter(property =>
        property.propertyLocation === activeFilters.selectedLocation
      );
    }

    // Apply property type filter
    if (activeFilters.selectedPropertyType) {
      filtered = filtered.filter(property =>
        property.propertyType === activeFilters.selectedPropertyType
      );
    }

    // Apply tags filter
    if (activeFilters.selectedTags.length > 0) {
      filtered = filtered.filter(property =>
        activeFilters.selectedTags.every(tag => property.tags.includes(tag))
      );
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, activeFilters]);

  // Handle search functionality
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      setFilteredProperties(properties);
      return;
    }

    const filtered = properties.filter(property => {
      // Search by location
      const locationMatch = property.propertyLocation.toLowerCase().includes(query);
      
      // Search by tags
      const tagMatch = property.tags.some(tag => 
        tag.toLowerCase().includes(query)
      );
      
      // Search by property name
      const nameMatch = property.propertyName.toLowerCase().includes(query);
      
      // Search by property type
      const typeMatch = property.propertyType.toLowerCase().includes(query);
      
      // Search by owner name
      const ownerMatch = property.owner.toLowerCase().includes(query);

      return locationMatch || tagMatch || nameMatch || typeMatch || ownerMatch;
    });

    setFilteredProperties(filtered);
  }, [searchQuery, properties]);

  // Handle filter application
  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
  };

  const handleItemClick = (itemId) => {
    console.log('HomePage: Item clicked with id:', itemId);
    setSelectedItem(itemId);
    setIsItemDetailsOpen(true);
  };

  const handleFavorite = async (e, itemId) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthOverlay(true);
      return;
    }

    try {
      const accountRef = doc(db, 'accounts', user.uid);
      const accountDoc = await getDoc(accountRef);
      const currentFavorites = accountDoc.data()?.itemsSaved || [];
      const isFavorited = currentFavorites.includes(itemId);

      if (isFavorited) {
        // Remove from favorites
        await updateDoc(accountRef, {
          itemsSaved: arrayRemove(itemId)
        });
        setUserFavorites(prev => prev.filter(id => id !== itemId));
      } else {
        // Add to favorites
        await updateDoc(accountRef, {
          itemsSaved: arrayUnion(itemId)
        });
        setUserFavorites(prev => [...prev, itemId]);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const createUserDocument = async (user) => {
    const accountRef = doc(db, 'accounts', user.uid);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      const accountData = {
        chatMates: {},
        convoId: "",
        comments: [""],
        contactNumber: "",
        dashboardId: "",
        dateJoined: serverTimestamp(),
        email: user.email || "",
        isOwner: false,
        itemsInterested: [""],
        itemsSaved: [""],
        profilePicUrl: user.photoURL || "",
        rating: 0,
        socials: {
          Facebook: "",
          Instagram: "",
          X: ""
        },
        testField: "",
        username: user.displayName || user.email?.split('@')[0] || ""
      };

      try {
        await setDoc(accountRef, accountData);
      } catch (error) {
        console.error("Error creating account document:", error);
      }
    }
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setShowAuthOverlay(false);
    }, 1500);
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
      handleSuccess();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'auth-overlay') {
      setShowAuthOverlay(false);
    }
  };

  const handleSort = (e) => {
    const option = e.target.value;
    setSortOption(option);
    
    let sorted = [...filteredProperties];
    switch(option) {
      case 'popular':
        sorted.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = a.dateAdded?.toDate() || new Date(0);
          const dateB = b.dateAdded?.toDate() || new Date(0);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const dateA = a.dateAdded?.toDate() || new Date(0);
          const dateB = b.dateAdded?.toDate() || new Date(0);
          return dateA - dateB;
        });
        break;
      case 'price-low':
        sorted.sort((a, b) => a.rent - b.rent);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.rent - a.rent);
        break;
      case 'top-rated':
        sorted.sort((a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0));
        break;
    }
    setFilteredProperties(sorted);
  };

  // Update useEffect to sort by most popular on initial load
  useEffect(() => {
    if (properties.length > 0) {
      const sorted = [...properties].sort((a, b) => 
        (b.likes?.length || 0) - (a.likes?.length || 0)
      );
      setFilteredProperties(sorted);
    }
  }, [properties]);

  return (
    <div className="homepage-container">
      {/* Navigation Bar */}
      <nav className={`navbar ${isLoading ? 'skeleton' : ''}`}>
        <div className="logo">
          <Link to="/" onClick={() => {
            setSearchQuery('');
            setActiveFilters({
              priceRange: { min: 0, max: 50000 },
              selectedTags: [],
              selectedLocation: '',
              selectedPropertyType: ''
            });
          }}>
            <img src={logoSvg} alt="StayEase Logo" className="logo-image" />
          </Link>
        </div>
        
        <div className="nav-links">
          <span>Properties</span>
          <span>People</span>
        </div>

        <div className="nav-right">
          <div className="language-switch">EN</div>
          <div 
            className="user-icon" 
            onClick={() => {
              if (user) {
                navigate('/account');
              } else {
                setShowAuthOverlay(true);
              }
            }} 
            role="button"
            aria-label="Account"
          >
            {user ? (
              user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="user-photo" 
                />
              ) : (
                user.displayName?.[0] || user.email?.[0] || '?'
              )
            ) : (
              '👤'
            )}
          </div>
        </div>
      </nav>

      <div className="homepage-layout">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className={`search-section ${isLoading ? 'skeleton' : ''}`}>
            <input
              type="text"
              className="search-bar"
              placeholder="Search for your perfect stay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: isLoading ? 0 : 1 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Updated Sort Section with proper skeleton structure */}
          <div className={`sort-section ${isLoading ? 'skeleton' : ''}`}>
            {isLoading ? (
              <>
                <div className="skeleton-title"></div>
                <div className="skeleton-select"></div>
              </>
            ) : (
              <>
                <h3>Sort</h3>
                <select 
                  value={sortOption}
                  onChange={handleSort}
                  className="sort-select"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="top-rated">Top Rated</option>
                </select>
              </>
            )}
          </div>

          <FilterMenu 
            isOpen={true} 
            onClose={() => {}} 
            onApplyFilters={handleApplyFilters}
            isLoading={isLoading}
          />
        </div>

        <div className="main-content">
          {/* Properties Grid */}
          <div className="properties-grid">
            {isLoading ? (
              // Show 8 skeleton cards while loading
              [...Array(8)].map((_, index) => (
                <div key={index} className="property-card skeleton">
                  <div className="property-placeholder">
                    <div className="skeleton-image"></div>
                    <div className="property-info">
                      <div className="skeleton-text skeleton-name"></div>
                      <div className="skeleton-text skeleton-location"></div>
                      <div className="skeleton-text skeleton-type"></div>
                      <div className="skeleton-text skeleton-price"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredProperties.length === 0 ? (
              <div className="no-results">
                No properties found matching your search criteria
              </div>
            ) : (
              filteredProperties.map((item) => (
                <div 
                  key={item.id} 
                  className="property-card"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="property-placeholder">
                    <div className="image-navigation">
                      {/* Previous Button */}
                      {currentImageIndex[item.id] > 0 && (
                        <button 
                          className="nav-button prev"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => ({
                              ...prev,
                              [item.id]: prev[item.id] - 1
                            }));
                          }}
                        >
                          ‹
                        </button>
                      )}

                      {/* Next Button */}
                      {currentImageIndex[item.id] < (item.propertyPhotos.length - 1) && (
                        <button 
                          className="nav-button next"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => ({
                              ...prev,
                              [item.id]: (prev[item.id] || 0) + 1
                            }));
                          }}
                        >
                          ›
                        </button>
                      )}

                      {/* Image */}
                      <img 
                        src={item.propertyPhotos[currentImageIndex[item.id] || 0]} 
                        alt={item.propertyName} 
                        className="property-image"
                      />

                      {/* Image Dots */}
                      <div className="image-dots">
                        {item.propertyPhotos.map((_, index) => (
                          <div
                            key={index}
                            className={`dot ${index === (currentImageIndex[item.id] || 0) ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(prev => ({
                                ...prev,
                                [item.id]: index
                              }));
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Verified Badge */}
                    {item.verified && (
                      <div className="verified-badge">
                        <span className="icon">✓</span>
                        <span>Verified</span>
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button 
                      className="favorite-button"
                      onClick={(e) => handleFavorite(e, item.id)}
                    >
                      {userFavorites.includes(item.id) ? '❤️' : '🤍'}
                    </button>

                    <div className="property-info">
                      <div className="property-header">
                        <div className="property-name">{item.propertyName}</div>
                        <div className="property-rating">★ {item.ratings?.overall || 'N/A'}</div>
                      </div>
                      <div className="property-location">{item.propertyLocation}</div>
                      <div className="property-type">{item.propertyType}</div>
                      <div className="property-price">₱{item.rent.toLocaleString()}/month</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAuthOverlay && (
        <div className="auth-overlay" onClick={handleOverlayClick}>
          <div className="auth-modal">
            {isSuccess ? (
              <div className="success-message">
                Successfully logged in!
              </div>
            ) : (
              <>
                <button className="close-button" onClick={() => setShowAuthOverlay(false)} aria-label="Close">×</button>
                <h2>Login</h2>
                {error && <div className="error-message">{error}</div>}

                <button onClick={handleGoogleAuth} className="google-button">
                  Continue with Google
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
