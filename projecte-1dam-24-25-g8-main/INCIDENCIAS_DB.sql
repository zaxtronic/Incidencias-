-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 19-05-2025 a las 17:07:55
-- Versión del servidor: 8.0.42-0ubuntu0.22.04.1
-- Versión de PHP: 8.2.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `a24dancolgar_Projecte_DAM`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ACTUALIZACION_INCIDENCIA`
--

CREATE TABLE `ACTUALIZACION_INCIDENCIA` (
  `id` int NOT NULL,
  `id_incidencia` int NOT NULL,
  `id_actor` int NOT NULL,
  `tipo_actor` enum('TECNICO','ADMINISTRADOR','USUARIO') NOT NULL,
  `comentario` text NOT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado_anterior` enum('ABIERTA','ASIGNADA','EN_PROGRESO','EN_ESPERA_USUARIO','RESUELTA','CERRADA') DEFAULT NULL,
  `estado_nuevo` enum('ABIERTA','ASIGNADA','EN_PROGRESO','EN_ESPERA_USUARIO','RESUELTA','CERRADA') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `ACTUALIZACION_INCIDENCIA`
--

INSERT INTO `ACTUALIZACION_INCIDENCIA` (`id`, `id_incidencia`, `id_actor`, `tipo_actor`, `comentario`, `fecha_actualizacion`, `estado_anterior`, `estado_nuevo`) VALUES
(1, 1, 1, 'TECNICO', 'Revisando la impresora. Parece un atasco de papel.', '2025-05-19 16:59:00', 'ASIGNADA', 'EN_PROGRESO'),
(2, 1, 1, 'TECNICO', 'Atasco de papel solucionado. Impresora operativa.', '2025-05-19 16:59:00', 'EN_PROGRESO', 'RESUELTA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ADMINISTRADOR`
--

CREATE TABLE `ADMINISTRADOR` (
  `id` int NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `ADMINISTRADOR`
--

INSERT INTO `ADMINISTRADOR` (`id`, `nom`, `email`, `contrasena`) VALUES
(1, 'Carlos Jefe', 'carlos.jefe@admin.com', 'hash_contrasena_carlos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `INCIDENCIA`
--

CREATE TABLE `INCIDENCIA` (
  `id` int NOT NULL,
  `id_usuario_creador` int NOT NULL,
  `id_tecnico_asignado` int DEFAULT NULL,
  `id_administrador_gestor` int DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `equipo` varchar(100) DEFAULT NULL,
  `urgencia` enum('BAJA','MEDIA','ALTA') DEFAULT 'MEDIA',
  `estado` enum('ABIERTA','ASIGNADA','EN_PROGRESO','EN_ESPERA_USUARIO','RESUELTA','CERRADA') DEFAULT 'ABIERTA',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_asignacion` timestamp NULL DEFAULT NULL,
  `fecha_resolucion` timestamp NULL DEFAULT NULL,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `INCIDENCIA`
--

INSERT INTO `INCIDENCIA` (`id`, `id_usuario_creador`, `id_tecnico_asignado`, `id_administrador_gestor`, `titulo`, `descripcion`, `ubicacion`, `equipo`, `urgencia`, `estado`, `fecha_creacion`, `fecha_asignacion`, `fecha_resolucion`, `fecha_cierre`, `fecha_actualizacion`) VALUES
(1, 1, 1, 1, 'Impresora no funciona', 'La impresora de la oficina 301 no imprime nada, parece atascada.', 'Oficina 301', 'HP LaserJet Pro M404dn', 'ALTA', 'RESUELTA', '2025-05-19 16:59:00', '2025-05-19 16:59:00', '2025-05-19 16:59:00', NULL, '2025-05-19 16:59:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `TECNICO`
--

CREATE TABLE `TECNICO` (
  `id` int NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `TECNICO`
--

INSERT INTO `TECNICO` (`id`, `nom`, `email`, `contrasena`, `especialidad`) VALUES
(1, 'Ana López', 'ana.lopez@tecnico.com', 'hash_contrasena_ana', 'Redes');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `USUARIO`
--

CREATE TABLE `USUARIO` (
  `id` int NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `USUARIO`
--

INSERT INTO `USUARIO` (`id`, `nom`, `email`, `contrasena`, `fecha_registro`) VALUES
(1, 'Juan Pérez', 'juan.perez@email.com', 'hash_contrasena_juan', '2025-05-19 16:59:00');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ACTUALIZACION_INCIDENCIA`
--
ALTER TABLE `ACTUALIZACION_INCIDENCIA`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_actualizacion_incidencia` (`id_incidencia`);

--
-- Indices de la tabla `ADMINISTRADOR`
--
ALTER TABLE `ADMINISTRADOR`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `INCIDENCIA`
--
ALTER TABLE `INCIDENCIA`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_administrador_gestor` (`id_administrador_gestor`),
  ADD KEY `idx_incidencia_estado` (`estado`),
  ADD KEY `idx_incidencia_tecnico` (`id_tecnico_asignado`),
  ADD KEY `idx_incidencia_usuario` (`id_usuario_creador`);

--
-- Indices de la tabla `TECNICO`
--
ALTER TABLE `TECNICO`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `USUARIO`
--
ALTER TABLE `USUARIO`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ACTUALIZACION_INCIDENCIA`
--
ALTER TABLE `ACTUALIZACION_INCIDENCIA`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `ADMINISTRADOR`
--
ALTER TABLE `ADMINISTRADOR`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `INCIDENCIA`
--
ALTER TABLE `INCIDENCIA`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `TECNICO`
--
ALTER TABLE `TECNICO`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `USUARIO`
--
ALTER TABLE `USUARIO`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ACTUALIZACION_INCIDENCIA`
--
ALTER TABLE `ACTUALIZACION_INCIDENCIA`
  ADD CONSTRAINT `ACTUALIZACION_INCIDENCIA_ibfk_1` FOREIGN KEY (`id_incidencia`) REFERENCES `INCIDENCIA` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `INCIDENCIA`
--
ALTER TABLE `INCIDENCIA`
  ADD CONSTRAINT `INCIDENCIA_ibfk_1` FOREIGN KEY (`id_usuario_creador`) REFERENCES `USUARIO` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `INCIDENCIA_ibfk_2` FOREIGN KEY (`id_tecnico_asignado`) REFERENCES `TECNICO` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `INCIDENCIA_ibfk_3` FOREIGN KEY (`id_administrador_gestor`) REFERENCES `ADMINISTRADOR` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
