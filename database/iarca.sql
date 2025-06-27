-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-06-2025 a las 20:55:25
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `iarca`
--
CREATE DATABASE IF NOT EXISTS `iarca` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `iarca`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estadoactualizacion`
--

DROP TABLE IF EXISTS `estadoactualizacion`;
CREATE TABLE `estadoactualizacion` (
  `id` int(11) NOT NULL,
  `repositorio` varchar(50) NOT NULL,
  `actualizandose` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estadoactualizacion`
--

INSERT INTO `estadoactualizacion` (`id`, `repositorio`, `actualizandose`) VALUES
(1, 'Biblat', 0),
(2, 'Dialnet', 0),
(3, 'DOAJ', 0),
(4, 'Latindex', 0),
(5, 'NBRA', 0),
(6, 'Redalyc', 0),
(7, 'Scielo', 0),
(8, 'Scimago', 0),
(9, 'Web of Science', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `contrasenia` varchar(50) NOT NULL,
  `imagenPerfil` varchar(200) NOT NULL DEFAULT 'avatar unisex.webp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id`, `nombre`, `contrasenia`, `imagenPerfil`) VALUES
(1, 'franco', '111', 'avatar unisex.webp'),
(2, 'leandro', '222', 'avatar unisex.webp');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `estadoactualizacion`
--
ALTER TABLE `estadoactualizacion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `estadoactualizacion`
--
ALTER TABLE `estadoactualizacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
