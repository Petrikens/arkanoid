const COLLISION_EPSILON = 0.01;

export function getBallBlockCollision(ball, block) {
  const bounds = block.getCollisionBounds();
  const radius = ball.radius;
  const expandedBounds = {
    left: bounds.left - radius,
    right: bounds.right + radius,
    top: bounds.top - radius,
    bottom: bounds.bottom + radius,
  };

  if (
    ball.x < expandedBounds.left ||
    ball.x > expandedBounds.right ||
    ball.y < expandedBounds.top ||
    ball.y > expandedBounds.bottom
  ) {
    return null;
  }

  const normal = getCollisionNormal(ball, bounds, expandedBounds);

  return {
    normal,
    position: getResolvedPosition(ball, expandedBounds, normal),
  };
}

function getCollisionNormal(ball, bounds, expandedBounds) {
  const previousPosition = ball.getPreviousPosition();
  const velocity = ball.getVelocity();

  if (previousPosition.y <= bounds.top - ball.radius && velocity.y > 0) {
    return { x: 0, y: -1 };
  }

  if (previousPosition.y >= bounds.bottom + ball.radius && velocity.y < 0) {
    return { x: 0, y: 1 };
  }

  if (previousPosition.x <= bounds.left - ball.radius && velocity.x > 0) {
    return { x: -1, y: 0 };
  }

  if (previousPosition.x >= bounds.right + ball.radius && velocity.x < 0) {
    return { x: 1, y: 0 };
  }

  const penetrations = [
    {
      depth: ball.x - expandedBounds.left,
      normal: { x: -1, y: 0 },
    },
    {
      depth: expandedBounds.right - ball.x,
      normal: { x: 1, y: 0 },
    },
    {
      depth: ball.y - expandedBounds.top,
      normal: { x: 0, y: -1 },
    },
    {
      depth: expandedBounds.bottom - ball.y,
      normal: { x: 0, y: 1 },
    },
  ];

  penetrations.sort((left, right) => left.depth - right.depth);

  return penetrations[0].normal;
}

function getResolvedPosition(ball, expandedBounds, normal) {
  if (normal.x < 0) {
    return {
      x: expandedBounds.left - COLLISION_EPSILON,
      y: ball.y,
    };
  }

  if (normal.x > 0) {
    return {
      x: expandedBounds.right + COLLISION_EPSILON,
      y: ball.y,
    };
  }

  if (normal.y < 0) {
    return {
      x: ball.x,
      y: expandedBounds.top - COLLISION_EPSILON,
    };
  }

  return {
    x: ball.x,
    y: expandedBounds.bottom + COLLISION_EPSILON,
  };
}
