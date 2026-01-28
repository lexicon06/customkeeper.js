var dbName = "cn.db";
var userSelection = {};

// Inicializar base de datos
function initDatabase() {
    var queryString = "CREATE TABLE IF NOT EXISTS custom_names (custom_name_id INTEGER PRIMARY KEY AUTOINCREMENT, username NVARCHAR(255) NOT NULL, display_name NVARCHAR(255) NOT NULL, last_used DATETIME DEFAULT CURRENT_TIMESTAMP, created_date DATETIME DEFAULT CURRENT_TIMESTAMP)";
    var query = new Query(queryString);
    
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        sql.query(query);
        sql.close();
        print("Sistema de Nombres inicializado");
        return true;
    } else {
        print("Error al conectar con la base de datos");
    }
    return false;
}

// Función para limpiar entradas huérfanas
function cleanupOrphanedNames() {
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        var cleanupQuery = new Query("DELETE FROM custom_names WHERE display_name = '' OR display_name IS NULL OR username = '' OR username IS NULL");
        sql.query(cleanupQuery);
        
        if (sql.affectedRows > 0) {
            print("Cleanup completed: " + sql.affectedRows + " orphaned entries removed");
        }
        sql.close();
        return true;
    }
    return false;
}

// Obtener el último nombre usado
function getLastUsedCustomName(username) {
    var queryString = "SELECT display_name FROM custom_names WHERE username = {0} ORDER BY last_used DESC LIMIT 1";
    var query = new Query(queryString, username);
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        sql.query(query);
        if (sql.read) {
            var result = sql.value("display_name");
            sql.close();
            return result;
        }
        sql.close();
    }
    return null;
}

// Obtener todos los nombres personalizados de un usuario
function getUserCustomNames(username) {
    var names = [];
    var queryString = "SELECT display_name, last_used FROM custom_names WHERE username = {0} ORDER BY last_used DESC";
    var query = new Query(queryString, username);
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        sql.query(query);
        while (sql.read) {
            names.push({
                name: sql.value("display_name"),
                lastUsed: sql.value("last_used")
            });
        }
        sql.close();
    }
    return names;
}

// Guardar nombre en el armario
function saveCustomNameToWardrobe(username, displayName) {
    // No guardar nombres vacíos
    if (!displayName || displayName.trim() === "") {
        return false;
    }
    
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        var updateQuery = new Query("UPDATE custom_names SET last_used = CURRENT_TIMESTAMP WHERE username = {0} AND display_name = {1}", username, displayName);
        sql.query(updateQuery);
        
        // Si no se actualizaron filas, insertar nuevo
        if (sql.affectedRows === 0) {
            var insertQuery = new Query("INSERT INTO custom_names (username, display_name, last_used) VALUES ({0}, {1}, CURRENT_TIMESTAMP)", username, displayName);
            sql.query(insertQuery);
        }
        
        sql.close();
        return true;
    }
    return false;
}

// Eliminar nombre personalizado
function deleteCustomName(username, displayName) {
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        var deleteQuery = new Query("DELETE FROM custom_names WHERE username = {0} AND display_name = {1}", username, displayName);
        sql.query(deleteQuery);
        var rowsDeleted = sql.affectedRows;
        
        // Si se eliminó el último nombre, borrar completamente al usuario de la base de datos
        var remainingQuery = new Query("SELECT COUNT(*) as count FROM custom_names WHERE username = {0}", username);
        sql.query(remainingQuery);
        if (sql.read) {
            var remainingCount = sql.value("count");
            if (remainingCount === 0) {
                // El usuario no tiene más nombres, ya está limpio
                // No necesitamos hacer nada más porque todas sus entradas ya fueron eliminadas
            }
        }
        
        sql.close();
        return rowsDeleted > 0;
    }
    return false;
}

// Función cuando un usuario se une
function onJoin(userobj) {
    if (userobj.customName == "") {
        var savedName = getLastUsedCustomName(userobj.name);
        if (savedName) {
            // Solo aplicar el nombre si existe en la base de datos
            var names = getUserCustomNames(userobj.name);
            var nameExists = false;
            
            for (var i = 0; i < names.length; i++) {
                if (names[i].name === savedName) {
                    nameExists = true;
                    break;
                }
            }
            
            if (nameExists) {
                userobj.customName = savedName;
            } else {
                // El nombre ya no existe, limpiar
                userobj.customName = "";
            }
        }
    } else if (userobj.customName != "") {
        // Solo guardar si el usuario tiene un nombre customizado
        saveCustomNameToWardrobe(userobj.name, userobj.customName);
    }
}

var userMenus = {};

// Mostrar menú de nombres
function showNamesMenu(userobj, command) {
    var names = getUserCustomNames(userobj.name);
    var menuType = (command == "nicks") ? "nicks" : "ropas";
    
    if (names.length > 0) {
        var title = (menuType == "nicks") ? "═════ Tus Nicks ═════" : "═════ Tus Ropas ═════";
        sendPM(userobj, Room.botName, title);
        
        var letters = "abcdefghijklmnopqrstuvwxyz";
        for (var i = 0; i < names.length && i < 10; i++) { // Limitado a 10
            var letter = letters.charAt(i);
            var nameEntry = "[" + letter + "] " + names[i].name;
            
            // Marcar el activo
            if (names[i].name == userobj.customName) {
                nameEntry += " ✓";
            }
            sendPM(userobj, Room.botName, nameEntry);
        }
        
        sendPM(userobj, Room.botName, "══════════════════════");
        sendPM(userobj, Room.botName, "Escribe la letra para usar ese " + ((menuType == "nicks") ? "nick" : "ropa"));
        sendPM(userobj, Room.botName, "/nextc - Siguiente  /prevc - Anterior");
        
        userMenus[userobj.name] = {
            type: menuType,
            names: names
        };
        
    } else {
        sendPM(userobj, Room.botName, "No tienes " + ((menuType == "nicks") ? "nicks" : "ropas") + " guardados.");
    }
}

// Mostrar menú para borrar nombres
function showBorrarMenu(userobj) {
    var names = getUserCustomNames(userobj.name);
    if (names.length > 0) {
        sendPM(userobj, Room.botName, "═══ Borrar Nombres ═══");
        
        var letters = "abcdefghijklmnopqrstuvwxyz";
        for (var i = 0; i < names.length && i < 10; i++) {
            var letter = letters.charAt(i);
            var nameEntry = "[" + letter + "] " + names[i].name;
            
            if (names[i].name == userobj.customName) {
                nameEntry += " (Activo)";
            }
            sendPM(userobj, Room.botName, nameEntry);
        }
        
        // Advertencia especial si solo queda uno
        if (names.length == 1) {
            sendPM(userobj, Room.botName, "⚠️ Este es tu ÚLTIMO nombre guardado");
            sendPM(userobj, Room.botName, "Si lo eliminas, tu lista quedará vacía");
        }
        
        sendPM(userobj, Room.botName, "═════════════════════");
        sendPM(userobj, Room.botName, "Escribe la letra para BORRAR ese nombre");
        
        userMenus[userobj.name] = {
            type: "borrar",
            names: names
        };
        
    } else {
        sendPM(userobj, Room.botName, "No tienes nombres para borrar.");
    }
}

// Siguiente nombre
function nextCustomName(userobj) {
    var names = getUserCustomNames(userobj.name);
    if (names.length == 0) {
        sendPM(userobj, Room.botName, "No tienes nombres guardados.");
        return;
    }
    
    var currentName = userobj.customName;
    var currentIndex = -1;
    
    // Buscar índice actual
    for (var i = 0; i < names.length; i++) {
        if (names[i].name == currentName) {
            currentIndex = i;
            break;
        }
    }
    
    // Si no se encuentra o es la última, usar la primera
    if (currentIndex == -1 || currentIndex >= names.length - 1) {
        var nextName = names[0].name;
    } else {
        var nextName = names[currentIndex + 1].name;
    }
    
    userobj.customName = nextName;
    saveCustomNameToWardrobe(userobj.name, nextName);
    sendPM(userobj, Room.botName, "✓ Nombre cambiado: " + nextName);
}

// Nombre anterior
function prevCustomName(userobj) {
    var names = getUserCustomNames(userobj.name);
    if (names.length == 0) {
        sendPM(userobj, Room.botName, "No tienes nombres guardados.");
        return;
    }
    
    var currentName = userobj.customName;
    var currentIndex = -1;
    
    // Buscar índice actual
    for (var i = 0; i < names.length; i++) {
        if (names[i].name == currentName) {
            currentIndex = i;
            break;
        }
    }
    
    // Si no se encuentra o es la primera, usar la última
    if (currentIndex == -1 || currentIndex == 0) {
        var prevName = names[names.length - 1].name;
    } else {
        var prevName = names[currentIndex - 1].name;
    }
    
    userobj.customName = prevName;
    saveCustomNameToWardrobe(userobj.name, prevName);
    sendPM(userobj, Room.botName, "✓ Nombre cambiado: " + prevName);
}

// Procesar mensajes privados del bot
function onBotPM(userobj, text) {
    // Menú simplificado - solo acepta letras para selección
    if (userMenus[userobj.name]) {
        var menu = userMenus[userobj.name];
        var input = text.toLowerCase().trim();
        
        // Solo aceptar letras durante menú
        if (input.length == 1 && /[a-z]/.test(input)) {
            var letterIndex = input.charCodeAt(0) - 97; // 'a' = 0
            
            if (letterIndex >= 0 && letterIndex < menu.names.length && letterIndex < 26) {
                if (menu.type == "ropas" || menu.type == "nicks") {
                    // Seleccionar ropa/nick
                    var selectedName = menu.names[letterIndex].name;
                    userobj.customName = selectedName;
                    saveCustomNameToWardrobe(userobj.name, selectedName);
                    sendPM(userobj, Room.botName, "✓ Cambiado a: " + selectedName);
                    
                } else if (menu.type == "borrar") {
                    // BORRAR ropa/nick
                    var nameToDelete = menu.names[letterIndex].name;
                    
                    // Verificar cuántos nombres tiene el usuario antes de borrar
                    var namesBeforeDelete = getUserCustomNames(userobj.name);
                    var wasLastName = (namesBeforeDelete.length === 1);
                    
                    if (deleteCustomName(userobj.name, nameToDelete)) {
                        sendPM(userobj, Room.botName, "✓ Eliminado: " + nameToDelete);
                        
                        // Si borró el nombre activo, limpiarlo
                        if (userobj.customName == nameToDelete) {
                            userobj.customName = "";
                            sendPM(userobj, Room.botName, "→ Tu nombre activo ha sido eliminado");
                            
                            // Verificar si era el último nombre
                            var remainingNames = getUserCustomNames(userobj.name);
                            if (remainingNames.length > 0) {
                                // Asignar automáticamente el siguiente (o anterior) disponible
                                userobj.customName = remainingNames[0].name;
                                saveCustomNameToWardrobe(userobj.name, userobj.customName);
                                sendPM(userobj, Room.botName, "→ Automáticamente cambiado a: " + userobj.customName);
                            } else if (wasLastName) {
                                // El usuario acaba de borrar su ÚLTIMO nombre
                                userobj.customName = "";
                                sendPM(userobj, Room.botName, "→ Tu lista de nombres ahora está vacía");
                                
                                // IMPORTANTE: Forzar limpieza de caché
                                // Agregar un marcador especial para este usuario
                                if (!userSelection[userobj.name]) {
                                    userSelection[userobj.name] = {};
                                }
                                userSelection[userobj.name].lastNameDeleted = true;
                            }
                        }
                    } else {
                        sendPM(userobj, Room.botName, "✗ Error al eliminar o nombre no encontrado");
                    }
                }
                delete userMenus[userobj.name];
                return "";
            }
        }
        delete userMenus[userobj.name];
    }
    
    // Guardar nombre automáticamente (solo si no es vacío)
    if (userobj.customName != "") {
        saveCustomNameToWardrobe(userobj.name, userobj.customName);
    }
    
    return text;
}

// Procesar comandos
function onCommand(userobj, command, tUser, args) {
    if (command == "ropas" || command == "nicks") {
        showNamesMenu(userobj, command);
        return true;
    }
    
    if (command == "borrar") {
        showBorrarMenu(userobj);
        return true;
    }
    
    if (command == "nextc") {
        nextCustomName(userobj);
        return true;
    }
    
    if (command == "prevc") {
        prevCustomName(userobj);
        return true;
    }
    
    return false;
}

// Inicializar al cargar
initDatabase();
cleanupOrphanedNames();
