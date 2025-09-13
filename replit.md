# Real-time Order Management System

## Overview

This is a full-stack real-time order management system that demonstrates change data capture (CDC) capabilities. The application automatically detects changes in the orders database table and pushes those changes in real-time to all connected clients via WebSockets. Built with a React frontend, Express.js backend, PostgreSQL database with Drizzle ORM, and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development
- **Vite** as the build tool for fast development and optimized production builds
- **shadcn/ui** component library built on Radix UI primitives for consistent, accessible UI components
- **TailwindCSS** for utility-first styling with custom design tokens
- **TanStack Query** for server state management, caching, and data synchronization
- **Wouter** as a lightweight client-side router
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript for the REST API
- **WebSocket Server** for real-time bidirectional communication
- **Drizzle ORM** with PostgreSQL dialect for database operations and schema management
- **Zod schemas** shared between frontend and backend for consistent validation
- **Connection pooling** via Neon serverless for efficient database connections

### Database Design
- **PostgreSQL** with enum types for order status management
- **Orders table** with comprehensive fields including customer info, product details, pricing, and timestamps
- **Users table** for basic authentication structure
- **Automatic UUID generation** for primary keys
- **Timestamp tracking** for created/updated times with automatic updates

### Real-time Communication
- **WebSocket integration** at `/ws` endpoint for live data updates
- **Client connection tracking** to broadcast connection counts
- **Automatic reconnection** logic with exponential backoff
- **Message broadcasting** to all connected clients when data changes occur
- **Structured message types** for different event categories (order changes, client count updates)

### State Management Pattern
- **Server-driven state** with optimistic UI updates
- **Query invalidation** on WebSocket events to ensure data consistency
- **Local notification system** for real-time change alerts
- **Pagination and filtering** with URL state management
- **Form state isolation** with modal-based interactions

### Development and Deployment
- **ESBuild** for production server bundling
- **Development hot reload** with Vite middleware integration
- **Environment-based configuration** for database connections
- **Replit-specific plugins** for development tooling and error handling
- **Modular component architecture** with clear separation of concerns