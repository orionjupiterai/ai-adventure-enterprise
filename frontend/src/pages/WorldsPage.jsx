import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  Skeleton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Search as SearchIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'

const GET_WORLDS = gql`
  query GetWorlds($page: Int, $limit: Int, $search: String, $tags: [String!], $sortBy: String, $order: String, $featured: Boolean) {
    worlds(page: $page, limit: $limit, search: $search, tags: $tags, sortBy: $sortBy, order: $order, featured: $featured) {
      worlds {
        id
        name
        description
        thumbnailUrl
        tags
        playCount
        ratingAverage
        ratingCount
        author {
          id
          username
          displayName
        }
        createdAt
      }
      total
      totalPages
    }
  }
`

const WorldsPage = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedTags, setSelectedTags] = useState([])

  const { loading, error, data, refetch } = useQuery(GET_WORLDS, {
    variables: {
      page,
      limit: 12,
      search,
      tags: selectedTags.length > 0 ? selectedTags : null,
      sortBy: sortBy.split('_')[0],
      order: sortBy.includes('asc') ? 'ASC' : 'DESC'
    }
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
    setPage(1)
  }

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
    setPage(1)
  }

  const popularTags = ['fantasy', 'sci-fi', 'mystery', 'horror', 'romance', 'adventure', 'comedy', 'historical']

  const renderWorldCard = (world) => (
    <Fade in key={world.id}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            '& .play-overlay': {
              opacity: 1
            }
          }
        }}
        onClick={() => navigate(`/worlds/${world.id}`)}
      >
        <Box sx={{ position: 'relative' }}>
          {world.thumbnailUrl ? (
            <CardMedia
              component="img"
              height="200"
              image={world.thumbnailUrl}
              alt={world.name}
              sx={{ objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                height: 200,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h1" sx={{ opacity: 0.2 }}>
                {world.name[0]}
              </Typography>
            </Box>
          )}
          <Box
            className="play-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            <PlayIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          </Box>
        </Box>
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom noWrap>
            {world.name}
          </Typography>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              height: '2.5em',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {world.description || 'No description available'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
            {world.tags.slice(0, 3).map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ fontSize: '0.75rem' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleTagToggle(tag)
                }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={world.ratingAverage}
                precision={0.5}
                size="small"
                readOnly
              />
              <Typography variant="body2" color="text.secondary">
                ({world.ratingCount})
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {world.author.displayName || world.author.username}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {world.playCount} plays
            </Typography>
          </Box>
        </CardActions>
      </Card>
    </Fade>
  )

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Explore Worlds
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Discover amazing adventures created by our community
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box component="form" onSubmit={handleSearch}>
              <TextField
                fullWidth
                placeholder="Search worlds..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button type="submit" variant="contained" size="small">
                        Search
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
              >
                <MenuItem value="created_at_desc">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    Newest First
                  </Box>
                </MenuItem>
                <MenuItem value="created_at_asc">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    Oldest First
                  </Box>
                </MenuItem>
                <MenuItem value="play_count_desc">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingIcon fontSize="small" />
                    Most Played
                  </Box>
                </MenuItem>
                <MenuItem value="rating_average_desc">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon fontSize="small" />
                    Highest Rated
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="grid">
                  <Tooltip title="Grid view">
                    <ViewModuleIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="list">
                  <Tooltip title="List view">
                    <ViewListIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>

        {/* Tags */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Filter by tags:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {popularTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => handleTagToggle(tag)}
                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Worlds Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Grid container spacing={3}>
            {data?.worlds.worlds.map(world => (
              <Grid
                item
                xs={12}
                sm={viewMode === 'list' ? 12 : 6}
                md={viewMode === 'list' ? 12 : 4}
                lg={viewMode === 'list' ? 12 : 3}
                key={world.id}
              >
                {renderWorldCard(world)}
              </Grid>
            ))}
          </Grid>

          {data?.worlds.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={data.worlds.totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  )
}

export default WorldsPage