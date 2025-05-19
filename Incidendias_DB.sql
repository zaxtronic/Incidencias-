-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 19-05-2025 a las 17:02:54
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
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ACTUALIZACION_INCIDENCIA`
--
ALTER TABLE `ACTUALIZACION_INCIDENCIA`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ACTUALIZACION_INCIDENCIA`
--
ALTER TABLE `ACTUALIZACION_INCIDENCIA`
  ADD CONSTRAINT `ACTUALIZACION_INCIDENCIA_ibfk_1` FOREIGN KEY (`id_incidencia`) REFERENCES `INCIDENCIA` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
