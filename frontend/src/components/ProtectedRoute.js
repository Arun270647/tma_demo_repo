import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import Preloader from './Preloader'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <Preloader fadeOut={!loading} />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
