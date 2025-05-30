// src/models/Usuari.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const bcrypt = require('bcryptjs');

const Usuari = sequelize.define('Usuari', {
    id_usuari: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: { // O email
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: true // Pot ser opcional o omplir-se després
    },
    rol: {
        type: DataTypes.ENUM('usuari', 'tecnic', 'administrador'),
        allowNull: false,
        defaultValue: 'usuari'
    },
    // Si un usuari de rol 'tecnic' està directament lligat a un registre de la taula 'Tecnic'
    // id_tecnic_fk: { 
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: 'Tecnics', // Nom de la taula de Tècnics
    //         key: 'id_tecnic'
    //     }
    // }
}, {
    tableName: 'usuaris',
    timestamps: true,
    hooks: {
        beforeCreate: async (usuari) => {
            if (usuari.password) {
                const salt = await bcrypt.genSalt(10);
                usuari.password = await bcrypt.hash(usuari.password, salt);
            }
        },
        beforeUpdate: async (usuari) => {
            if (usuari.changed('password')) { // Només hashejar si la contrasenya ha canviat
                const salt = await bcrypt.genSalt(10);
                usuari.password = await bcrypt.hash(usuari.password, salt);
            }
        }
    }
});

// Mètode per comparar contrasenyes
Usuari.prototype.compararPassword = async function (passwordEntrada) {
    return await bcrypt.compare(passwordEntrada, this.password);
};

// (Opcional) Relació si tens una taula Tecnic separada per a dades de tècnic
// const Tecnic = require('./Tecnic'); // Si el model Tecnic ja existeix
// Usuari.belongsTo(Tecnic, { foreignKey: 'id_tecnic_fk', as: 'dadesTecnic' });
// Tecnic.hasOne(Usuari, { foreignKey: 'id_tecnic_fk' });


module.exports = Usuari;