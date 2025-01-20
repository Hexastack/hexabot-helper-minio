# Hexabot MINIO Helper

Hexabot MINIO Helper is an extension that integrates MINIO storage for managing attachment files in your Hexabot project. This helper allows you to store, retrieve, and manage files efficiently using MINIO as the storage backend.

[Hexabot](https://hexabot.ai/) is an open-source chatbot / agent solution that allows users to create and manage AI-powered, multi-channel, and multilingual chatbots with ease. If you would like to learn more, please visit the [official github repo](https://github.com/Hexastack/Hexabot/).

## Features
- Seamless integration with MINIO storage.
- Configurable settings for MINIO endpoint, port, SSL usage, and authentication.
- Option to set a default storage bucket.
- Compatible with Hexabot's attachment file management system.

---

## Settings Configuration

To configure the MINIO Helper, use the following settings in the Hexabot admin panel under **Settings > Minio**:

| **Label**     | **Default Value**       | **Type**      | **Description**                                 |
|---------------|-------------------------|---------------|-------------------------------------------------|
| `endpoint`    | `minio`                | Text          | The endpoint for the MINIO server.             |
| `port`        | `9000`                 | Text          | The port for the MINIO server.                 |
| `use_ssl`     | `false`                | Checkbox      | Whether to use SSL for connections.            |
| `access_key`  | `<your-access-key>`    | Secret        | The access key for MINIO authentication.       |
| `secret_key`  | `<your-secret-key>`    | Secret        | The secret key for MINIO authentication.       |
| `bucket`      | `hexabot` (default)    | Text          | The default bucket for storing attachments.    |

---

## Installation

First, navigate to your Hexabot project directory and make sure the dependencies are installed:

```sh
cd ~/projects/my-hexabot-project
npm install hexabot-helper-minio
```

Then follow these steps:
1. Add the `docker-compose.minio.yml` and `docker-compose.minio.dev.yml` files under the `docker/` folder. 
2. Start the MINIO service with the following command: `hexabot dev --services minio`
3. Access the MINIO Console at http://localhost:9001.
4. Create or update your API keys (access key and secret key) via the MINIO Console.
5. Navigate to Settings > Minio in the admin panel and update the settings.
6. Set the default storage helper: Navigate to Settings > Chatbot and update the Default Storage Helper to use minio-helper.

## Docker compose files

Below an example of MINIO docker compose file `docker/docker-compose.minio.yml`:
```yaml
version: "3.8"

services:
  api:
    networks:
      - minio-network
    depends_on:
      minio:
        condition: service_healthy

  minio:
    container_name: minio
    image: minio/minio:latest
    command: server /data --console-address ":${MINIO_CONSOLE_PORT}"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    healthcheck:
      test:
        [
          "CMD",
          "mc",
          "ready",
          "local"
        ]
      interval: 30s
      timeout: 20s
      retries: 3
    volumes:
      - minio-data:/data
    networks:
      - minio-network

  minio-mc:
    image: minio/mc
    container_name: minio-mc
    depends_on:
      minio:
        condition: service_healthy
        restart: true
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc config host add --quiet minio http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}; 
      /usr/bin/mc mb "minio/${MINIO_DEFAULT_BUCKET_NAME}"
      "
    networks:
      - minio-network

volumes:
  minio-data:

networks:
  minio-network:
```

As well as the MINIO Console docker compose file `docker/docker-compose.minio.dev.yml`:
```yaml
version: "3.8"

services:
  minio:
    ports:
      - "9005:9000"
      - "${MINIO_CONSOLE_PORT}:${MINIO_CONSOLE_PORT}"

```

## Support
If you encounter any issues or have questions about using Hexabot MINIO Helper, feel free to contribute or open an issue on the Hexabot GitHub repository.

Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)
