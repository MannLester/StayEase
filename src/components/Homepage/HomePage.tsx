import { useState, useEffect } from 'react';
import './HomePage.css';
import ItemsContext from './ItemsContext.jsx';
import { FilterMenu } from './FilterMenu.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { User, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../supabase/supabaseClient';
import logoSvg from '../../assets/STAY.svg';

interface FilterType {
  priceRange: { min: number; max: number };
  selectedTags: string[];
  selectedLocation: string;
  selectedPropertyType: string;
}

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem] = useState<string | null>(null);
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: string;[key: string]: any }>>([]);
  const [filteredProperties, setFilteredProperties] = useState<Array<{ id: string;[key: string]: any }>>([]);
  const [activeFilters, setActiveFilters] = useState<FilterType>({
    priceRange: { min: 0, max: 50000 },
    selectedTags: [],
    selectedLocation: '',
    selectedPropertyType: ''
  });
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const navigate = useNavigate();
  const [error] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy] = useState('most-popular');

  const { user: supabaseUser, signInWithGoogle } = useSupabaseAuth();

  useEffect(() => {
    setUser(supabaseUser);
    if (supabaseUser) {
      const fetchUserFavorites = async () => {
        const { data: accountData, error } = await supabase
          .from('accounts')
          .select('items_saved')
          .eq('id', supabaseUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user favorites:', error);
          return;
        }
        
        setUserFavorites(accountData?.items_saved || []);
      };
      
      fetchUserFavorites();
    }
  }, [supabaseUser]);

  useEffect(() => {
    console.log('Setting up real-time listener for properties...');
    setIsLoading(true);

    // First, fetch all properties
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*');
      
      if (error) {
        console.error('Error fetching properties:', error);
        setIsLoading(false);
        return;
      }

      setProperties(data || []);
      setFilteredProperties(data || []);
      setIsLoading(false);
    };

    fetchProperties();

    // Then set up real-time listener using channel
    const channel = supabase.channel('properties-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'properties',
        },
        (payload) => {
          console.log('Received INSERT:', payload);
          setProperties(prev => [...prev, payload.new as any]);
          setFilteredProperties(prev => [...prev, payload.new as any]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'properties',
        },
        (payload) => {
          console.log('Received UPDATE:', payload);
          const updateItem = (prev: any[]) => 
            prev.map(item => item.id === (payload.new as any).id ? payload.new : item);
          setProperties(updateItem);
          setFilteredProperties(updateItem);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'properties',
        },
        (payload) => {
          console.log('Received DELETE:', payload);
          const deleteItem = (prev: any[]) => 
            prev.filter(item => item.id !== (payload.old as any).id);
          setProperties(deleteItem);
          setFilteredProperties(deleteItem);
        }
      );

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to properties channel');
      }
    });

    return () => {
      console.log('Cleaning up real-time listener...');
      supabase.removeChannel(channel);
    };
  }, []);

  const sortProperties = (properties:any, sortType:any) => {
    switch (sortType) {
      case 'most-popular':
        return [...properties].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      case 'newest':
        return [...properties].sort((a, b) => b.dateAdded - a.dateAdded);
      case 'oldest':
        return [...properties].sort((a, b) => a.dateAdded - b.dateAdded);
      case 'price-low':
        return [...properties].sort((a, b) => a.propertyPrice - b.propertyPrice);
      case 'price-high':
        return [...properties].sort((a, b) => b.propertyPrice - a.propertyPrice);
      case 'top-rated':
        return [...properties].sort((a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0));
      default:
        return properties;
    }
  };

  useEffect(() => {
    let filtered = [...properties];

    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.propertyLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (property.propertyTags && Array.isArray(property.propertyTags) && property.propertyTags.some((tag:string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        property.propertyType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (property.owner && typeof property.owner === 'string' && property.owner.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    filtered = filtered.filter(property =>
      property.propertyPrice >= activeFilters.priceRange.min &&
      property.propertyPrice <= activeFilters.priceRange.max
    );

    if (activeFilters.selectedLocation) {
      filtered = filtered.filter(property =>
        property.propertyLocation === activeFilters.selectedLocation
      );
    }

    if (activeFilters.selectedPropertyType) {
      filtered = filtered.filter(property =>
        property.propertyType === activeFilters.selectedPropertyType
      );
    }

    if (activeFilters.selectedTags.length > 0) {
      filtered = filtered.filter(property =>
        activeFilters.selectedTags.every(tag => property.propertyTags.includes(tag))
      );
    }

    filtered = sortProperties(filtered, sortBy);

    setFilteredProperties(filtered);
  }, [properties, searchQuery, activeFilters, sortBy]);

  const handleFilterChange = (filters: FilterType) => {
    setActiveFilters(filters);
  };

  const handleFavorite = async (e: React.MouseEvent<HTMLElement>, itemId: string, user: User) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthOverlay(true);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('accounts')
        .upsert({
          id: user.id,
          items_saved: userFavorites.includes(itemId) 
            ? userFavorites.filter(id => id !== itemId)
            : [...userFavorites, itemId]
        });

      if (updateError) throw updateError;

      setUserFavorites(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const createUserDocument = async (user: User) => {
    const { data: existingAccount, error: fetchError } = await supabase
      .from('accounts')
      .select()
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking existing account:", fetchError);
      return;
    }

    if (!existingAccount) {
      const accountData = {
        id: user.id,
        chat_mates: {},
        convo_id: "",
        comments: [],
        contact_number: "",
        dashboard_id: "",
        date_joined: new Date().toISOString(),
        description: "",
        email: user.email || "",
        follower_count: 0,
        is_owner: false,
        items_interested: [],
        items_saved: [],
        profile_pic_url: "",
        rating: 0,
        socials: {
          facebook: "",
          instagram: "",
          x: ""
        },
        test_field: "",
        username: ""
      };

      const { error: insertError } = await supabase
        .from('accounts')
        .insert([accountData]);

      if (insertError) {
        console.error("Error creating account document:", insertError);
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
      await signInWithGoogle();
      if (supabaseUser) {
        await createUserDocument(supabaseUser);
      }
      handleSuccess();
    } catch (error) {
      console.error("Error during Google authentication:", error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowAuthOverlay(false);
    }
  };

  return (
    <div className="homepage-container">
      {/* Navigation Bar */}
      <nav className="navbar">
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
                navigate('/account'); // Navigate to account page if user is logged in
              } else {
                setShowAuthOverlay(true); // Open the auth overlay if not logged in
              }
            }} 
            role="button"
            aria-label="Account"
          >
            {user ? (
              user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="user-photo" 
                />
              ) : (
                user.email?.[0] || '?'
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
              placeholder="Search for your perfect stay... "
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
          <FilterMenu 
            onFilterChange={handleFilterChange} 
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
                  onClick={() => navigate(`/property/${item.id}`)}
                >
                  <img 
                    src={item.propertyPhotos[0]} 
                    alt={item.propertyName} 
                    className="property-image" 
                  />
                  <button
                      className="favorite-button"
                      onClick={(e) => {
                        if (user !== null) {
                          handleFavorite(e, item.id, user);
                        } else {
                          console.error('User is not logged in.');
                        }
                      }}
                    >
                      {userFavorites.includes(item.id) ? '❤️' : '🤍'}
                    </button>
                  <div className="property-info">
                    <div className="property-name">{item.propertyName}</div>
                    <div className="property-location">{item.propertyLocation}</div>
                    <div className="property-type">{item.propertyType}</div>
                    <div className="property-price">₱{(item.propertyPrice ?? item.rent ?? 0).toLocaleString()}/month</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Item Details Overlay */}
      <ItemsContext
        isOpen={isItemDetailsOpen}
        onClose={() => setIsItemDetailsOpen(false)}
        itemId={selectedItem}
      />

      {showAuthOverlay && (
        <div className="auth-overlay" onClick={handleOverlayClick}>
          <div className="auth-modal">
            {isSuccess ? (
              <div className="success-message">
                Successfully logged in!
              </div>
            ) : (
              < >
                <button className="close-button" onClick={() => setShowAuthOverlay(false)} aria-label="Close">×</button>
                <h2>Login</h2>
                {error && <div className="error-message">{error}</div>}

                <button onClick={handleGoogleAuth} className="google-button">
                  Continue with Google
                </button>
              </ >
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;