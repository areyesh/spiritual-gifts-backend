import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Variables de Entorno
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_ENDPOINT = 'https://api.hubapi.com/crm/v3/objects/contacts';

// Ruta para crear o actualizar un contacto en HubSpot
app.post('/send-to-hubspot', async (req, res) => {
  const { firstName, lastName, email, scores } = req.body;

  const contactData = {
    properties: {
      firstname: firstName,
      lastname: lastName,
      email: email,
      spiritual_gift_scores: JSON.stringify(scores)
    }
  };

  try {
    // Paso 1: Buscar si el contacto existe usando el email
    const searchResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
        }),
      }
    );

    const searchResult = await searchResponse.json();
    console.log('HubSpot Search Response:', searchResult); // Log de búsqueda

    if (searchResult.results && searchResult.results.length > 0) {
      const contactId = searchResult.results[0].id;

      // Paso 2: Actualizar el contacto existente
      const updateResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(contactData),
        }
      );

      const updateResult = await updateResponse.json();
      console.log('HubSpot Update Response:', updateResult); // Log de actualización

      return res
        .status(200)
        .json({ message: 'Contact updated successfully!', result: updateResult });
    } else {
      // Paso 3: Crear un nuevo contacto si no existe
      const createResponse = await fetch(HUBSPOT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(contactData),
      });

      const createResult = await createResponse.json();
      console.log('HubSpot Create Response:', createResult); // Log de creación

      return res
        .status(201)
        .json({ message: 'Contact created successfully!', result: createResult });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
